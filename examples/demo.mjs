// aws s3api create-bucket --bucket unstorage-test-bucket --region us-east-1
// aws s3 ls s3://unstorage-test-bucket/prefix/
// aws s3api delete-bucket --bucket unstorage-test-bucket --region us-east-1

import { createStorage } from "unstorage";
import s3Driver from "../dist/index.mjs";

const storage = createStorage({
    driver: s3Driver({
        bucket: "unstorage-test-bucket", // required
        prefix: "prefix/", // optional
        region: "us-east-1", // optional, retrieved via environment variables
        // credentials: {
        //   // optional, retrieved by AWS SDK via environment variables
        //   accessKeyId: "xxxxxxxxxx", // DO NOT HARD-CODE SECRETS
        //   secretAccessKey: "xxxxxxxxxxxxxxxxxxxx", // DO NOT HARD-CODE SECRETS
        // },
        ttl: 30,
        ttlUpdateLastModified: true,
    }),
});

await storage.setItem("key1", "value1");
console.log(await storage.getItem("key1")); // "value"
console.log(await storage.getItem("key1")); // "value"
//console.log(await storage.getMeta("key1")); // "value"
await storage.removeItem("key1")
