# unstorage-driver-aws-s3

AWS S3 driver for [unstorage](https://unstorage.unjs.io).

This driver uses a S3 bucket as a key value store.

## Installation

```bash
# Using pnpm
pnpm add unstorage-driver-aws-s3

# Using yarn
yarn add unstorage-driver-aws-s3

# Using npm
npm install unstorage-driver-aws-s3
```

## Usage

Dependend on the target enviroment it will need `@aws-sdk/client-s3` in your project

```bash
npm i -D @aws-sdk/client-s3
```

```js
import { createStorage } from "unstorage";
import s3Driver from "unstorage/drivers/aws-s3";

const storage = createStorage({
  driver: s3Driver({
    bucket: "my-bucket-name", // required
    prefix: "prefix/", // optional
    region: "us-east-1", // optional, retrieved via environment variables
    credentials: {
      // optional, retrieved by AWS SDK via environment variables
      accessKeyId: "xxxxxxxxxx", // DO NOT HARD-CODE SECRETS
      secretAccessKey: "xxxxxxxxxxxxxxxxxxxx", // DO NOT HARD-CODE SECRETS
    },
  }),
});
```

Temporary configurations:

```js
import { createStorage } from "unstorage";
import s3CacheDriver from "unstorage/drivers/aws-s3";

const storage = createStorage({
  driver: s3CacheDriver({
    bucket: "my-bucket-name", // required
    ttl: 300, // optional, values in seconds or 0 to disable
  }),
});
```

When `ttl` is set to a number greater than 0 the driver will add seconds to the current timestamp and set the TTL attribute.
Otherwise removing the `ttl` option or setting it to 0 will disable this functionality.

The `setItem` method support an additional options which allows you to override the general `ttl` option:

```js
await storage.setItem("key", "value", { ttl: 900 });
```

Since the S3 items deletion is asynchronous the driver will check the validity of the TTL attribute before returning them from `getItem`. `getKeys` cannot check for TTL. This in order to ensure that no expired items will be returned.

**Authentication:**

The driver supports the default [AWS SDK credentials](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html).

The IAM role or IAM user that use the driver need the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetItem", "s3:PutItem", "s3:Scan", "s3:DeleteItem"],
      "Resource": "arn:aws:s3:*:*:table/my-table-name"
    }
  ]
}
```

**Options:**

- `bucket`: The name of the S3 bucket.
- `prefix`: The key prefix.
- `region`: The AWS region to use.
- `credentials`: The AWS SDK credentials object.
- `ttl`: The number of seconds to add to the current timestamp to set the TTL attribute. Set to 0 to disable it.

### Contribution

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
1. Create your Feature Branch (git checkout -b feature/AmazingFeature)
1. Commit your Changes (git commit -m 'Add some AmazingFeature')
1. Push to the Branch (git push origin feature/AmazingFeature)
1. Open a Pull Request

### Original Source

The original source code for a dynamodb driver can be found at this [GitHub Pull Request](https://github.com/unjs/unstorage/pull/234) from [Fabio Gollinucci](https://github.com/daaru00).

### License

Distributed under the "bsd-2-clause" License. See [LICENSE.txt](LICENSE.txt) for more information.
