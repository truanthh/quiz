import { S3Client } from "@aws-sdk/client-s3";
import { config } from "../config.js";

export function createS3Client(): S3Client {
  const { endpoint, region, accessKeyId, secretAccessKey } = config.s3;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("S3 is not configured: set S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY");
  }
  return new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    // AWS SDK v3 defaults to computing/validating flexible checksums on S3
    // requests, which non-AWS S3 implementations (R2, MinIO, s3mock, ...)
    // often mishandle, causing confusing unrelated-looking request failures.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export function requireBucket(): string {
  const { bucket } = config.s3;
  if (!bucket) throw new Error("S3 is not configured: set S3_BUCKET");
  return bucket;
}
