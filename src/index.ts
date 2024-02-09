import { defineDriver } from "unstorage";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export interface S3StorageOptions {
    bucket: string;
    prefix?: string;
    region?: string;
    credentials?: any;
    ttl?: number;
    ttlUpdateLastModified?: boolean;
    client?: S3Client;
}

export interface S3SetItemOptions {
    ttl?: number;
}

const DRIVER_NAME = "aws-s3";

export default defineDriver((opts: S3StorageOptions) => {
    const ttl = opts.ttl !== undefined ? parseInt(String(opts.ttl)) : 0;
    const prefix = opts?.prefix ?? "";
    let client: S3Client;
    function getClient(): S3Client {
        if (!opts.bucket) {
            throw createRequiredError(DRIVER_NAME, "bucket");
        }
        if (Number.isNaN(ttl) || ttl < 0) {
            throw createError(DRIVER_NAME, "Invalid option `ttl`.");
        }
        if (!client) {
            client =
                opts.client ||
                new S3Client({
                    region: opts.region,
                    credentials: opts.credentials,
                })
        }
        return client;
    }

    function getTimestamp(): number {
        return Math.round(Date.now() / 1000);
    }
    function encodeBase64(input: string) {
        return Buffer.from(input, 'utf8').toString('base64');
    }
    function decodeBase64(input: string): string {
        return Buffer.from(input, 'base64').toString('utf8');
    }
    function createKey(key: string): string {
        return prefix + encodeBase64(key);
    }

    function decodeKey(key: string): string {
        return decodeBase64(key.substring(prefix.length));
    }

    async function getItemValue(key: string): Promise<any> {
        console.log('getMeta', key, createKey(key));
        try {
            const response = await getClient().send(

                new GetObjectCommand({
                    Bucket: opts.bucket,
                    Key: createKey(key),
                    IfModifiedSince: ttl > 0 ? new Date((getTimestamp() - ttl) * 1000) : undefined,
                })
            );

            if (response === undefined || response.Body === undefined) {
                return null;
            }

            return response.Body.transformToString();
        } catch (e) {
            if (typeof e === 'object' && e?.hasOwnProperty('name') && (e as { name?: string })?.name === "304") {
                return null;
            }
            throw e;
        }
    }

    async function putItemValue(
        key: string,
        value: any
    ): Promise<void> {

        if (ttl > 0 && opts.ttlUpdateLastModified === true) {
            await removeItem(key);
        }
        await getClient().send(
            new PutObjectCommand({
                Bucket: opts.bucket,
                Key: createKey(key),
                Body: value,
            })
        );
    }

    async function removeItem(key: string): Promise<void> {
        await getClient().send(
            new DeleteObjectCommand({
                Bucket: opts.bucket,
                Key: createKey(key),
            })
        );
    }

    async function listKeys(ContinuationToken?: string) {
        let { Contents: items, IsTruncated, NextContinuationToken } = await getClient().send(
            new ListObjectsV2Command({
                Bucket: opts.bucket,
                Prefix: opts?.prefix,
                ContinuationToken
            })
        );

        items = items || [];


        const ttlMark = new Date(getTimestamp() - ttl * 1000);
        let keys = items.flatMap((item) => {
            if (ttl > 0 && item.LastModified && ttlMark < item.LastModified) return []
            return item.Key ? decodeKey(item.Key) : []
        });
        if (IsTruncated) {
            keys = keys.concat(await listKeys(NextContinuationToken));
        }

        return keys;
    }

    /*
    // in production this breaks as unstorage adds the suffix "$" to the key
    async function getMeta(key: string) {
        console.log('getMeta', key, createKey(key));
        const response = await getClient().send(

            new GetObjectCommand({
                Bucket: opts.bucket,
                Key: createKey(key),
            })
        );
        if (response === undefined || response.Body === undefined) {
            return null;
        }
        return {
            mtime: response?.LastModified,
            ...response?.Metadata
        };
    }
*/
    return {
        name: DRIVER_NAME,
        options: opts,
        async hasItem(key) {
            const item = await getItemValue(key);
            return !!item;
        },
        async getItem(key) {
            return await getItemValue(key);
        },
        async setItem(key, value) {
            await putItemValue(key, value);
        },
        async removeItem(key) {
            await removeItem(key);
        },
        async getKeys() {
            return await listKeys();
        },
        async getMeta(key) {
            return await getMeta(key);
        },
        async clear() {
            const keys = await listKeys();
            await Promise.all(keys.map((key) => removeItem(key)));
        },
    };
});

export function createError(
    driver: string,
    message: string,
    //opts?: ErrorOptions
) {
    const err = new Error(`[unstorage] [${driver}] ${message}`/*, opts*/);
    return err;
}

export function createRequiredError(driver: string, name: string | string[]) {
    if (Array.isArray(name)) {
        return createError(
            driver,
            `Missing some of the required options ${name
                .map((n) => "`" + n + "`")
                .join(", ")}`
        );
    }
    return createError(driver, `Missing required option \`${name}\`.`);
}