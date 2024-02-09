import driver, { S3StorageOptions } from '../src/index'


import { testDriver } from "./utils";
import { mockClient } from "aws-sdk-client-mock";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const BUCKET_NAME = "mocked";

// Mocked in-memory data
let data = new Map();

describe("drivers: aws-s3", () => {
    // Init mocked client for test purpose

    const client = mockClient(S3Client);

    // Add command resolvers

    client
        .on(GetObjectCommand)
        .callsFake((input) => {
            const key = input.Key;
            if (!data.has(key)) {
                return { Item: undefined };
            }
            const value = data.get(key);
            if (value.Body === "ttl-expired") {
                throw { name: "304" };
            } else {
                return { ...value, Body: { transformToString: () => value.Body } };
            }
        })
        .on(ListObjectsV2Command)
        .callsFake(() => {
            return {
                IsTruncated: false,
                Contents: Array.from(data.entries()).map(([Key]) => ({
                    Key
                })),
            };
        })
        .on(PutObjectCommand)
        .callsFake((input) => {
            const value = data.get(input.Key);
            if (value && value.Body === input.Body) return // S3 doesn't update the LastModified or any other Meta data if the content is the same
            data.set(input.Key, { ...input, "LastModified": new Date() });
        })
        .on(DeleteObjectCommand)
        .callsFake((input) => {
            data.delete(input.Key);
        });

    // Setup test driver options

    {

        const options: S3StorageOptions = {
            bucket: BUCKET_NAME,
            prefix: "prefix/",
            region: "us-east-1",
            credentials: {},
            ttl: 0,
            client: client as unknown as S3Client,
        };

        // Common tests
        const onlyIfTTL = (options?.ttl ?? 0) > 0 ? describe : describe.skip;

        testDriver({
            driver: driver(options),
            additionalTests: (ctx) => {
                // it("getMeta", async () => {
                //     await ctx.storage.setItem("s1:a", "test_data");
                //     const meta = await ctx.storage.getMeta("s1:a");
                //     expect(meta?.mtime).toBeInstanceOf(Date);
                // });
                onlyIfTTL("ttl " + ((options?.ttl ?? 0) > 0 ? "activated" : "disabled"), () => {
                    it("getItem expired", async () => {
                        await ctx.storage.setItem("s1:ttl", "ttl-expired");
                        expect(await ctx.storage.getItem("s1:ttl")).toBe(null);
                    });
                })
            },
        });
    }
    {
        const options: S3StorageOptions = {
            bucket: BUCKET_NAME,
            prefix: "prefix/",
            region: "us-east-1",
            credentials: {},
            ttl: 10,
            client: client as unknown as S3Client,
        };
        const onlyIfTTL = (options?.ttl ?? 0) > 0 ? describe : describe.skip;
        testDriver({
            driver: driver(options),
            additionalTests: (ctx) => {
                // it("getMeta", async () => {
                //     await ctx.storage.setItem("s1:a", "test_data");
                //     const meta = await ctx.storage.getMeta("s1:a");
                //     expect(meta?.mtime).toBeInstanceOf(Date);
                // });
                onlyIfTTL("ttl " + ((options?.ttl ?? 0) > 0 ? "activated" : "disabled"), () => {
                    it("getItem expired", async () => {
                        await ctx.storage.setItem("s1:ttl", "ttl-expired");
                        expect(await ctx.storage.getItem("s1:ttl")).toBe(null);
                    });
                })
            },
        });
    }
});

function encodeBase64(input: string) {
    return Buffer.from(input, 'utf8').toString('base64');
}