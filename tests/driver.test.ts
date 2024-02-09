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
            return { ...value, Body: { transformToString: () => value.Body } };
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
            data.set(input.Key, input);
        })
        .on(DeleteObjectCommand)
        .callsFake((input) => {
            data.delete(input.Key);
        });

    // Setup test driver options

    const options: S3StorageOptions = {
        bucket: BUCKET_NAME,
        prefix: "prefix/",
        region: "us-east-1",
        credentials: {},
        ttl: 0,
        client: client as unknown as S3Client,
    };

    // Common tests

    testDriver({
        driver: driver(options),
        additionalTests: () => { },
    });
});