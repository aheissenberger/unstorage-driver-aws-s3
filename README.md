# unstorage-driver-aws-s3

AWS S3 bucket driver for [unstorage](https://unstorage.unjs.io).

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

#### Authentication:

The driver supports the default [AWS SDK credentials](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html).

The IAM role or IAM user that use the driver need the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:*:*:BUCKET_NAME"
    }
  ]
}
```

#### Options:

- `bucket`: The name of the S3 bucket.
- `prefix`: The key prefix.
- `region`: The AWS region to use.
- `credentials`: The AWS SDK credentials object.
- `ttl`: The number of seconds to add to the current timestamp to set the TTL attribute. Set to 0 to disable it. See [TTL Limitations](#ttl-limitations) (Default: 0)
- `ttlUpdateLastModified`: Delete existing Objects on `setItem` to allways update the `LastModified` timestamp. This will add an extra `DeleteObjectCommand` call to the s3 api. This Option is only activated when `ttl > 0` (Default: false)

#### TTL Limitations:

Based on constrains of the AWS S3 architecture the following limitations exist and have an impact when TTL is set:

- The S3 `LastModified` attribute and `IfModifiedSince` is used to implement the TTL option. Deletion of expired Objects need to be handled by an [S3 storage lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- Update to an existing object with identical value **will not change** the LastModify timestamp of the object set on creation.
- Use option `ttlUpdateLastModified` if you need this, but keep in mind that S3 does not support transactions and there is the risk that two different `setItem` overlap and the wrong one is deleted

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
