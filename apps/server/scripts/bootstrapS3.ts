// One-off dev setup: creates the local S3 bucket (see "S3-compatible object
// storage" in CLAUDE.md). Run after `docker compose up -d s3mock`, once:
// `npx tsx scripts/bootstrapS3.ts` from apps/server.
//
// adobe/s3mock (the local S3 stand-in - see docker-compose.yml for why not
// minio/localstack) allows anonymous GET/PUT and permissive CORS out of the
// box with no further configuration, so this only needs to create the bucket.
import "dotenv/config";
import { CreateBucketCommand } from "@aws-sdk/client-s3";
import { createS3Client, requireBucket } from "../src/storage/s3Client.js";

async function main() {
  const client = createS3Client();
  const bucket = requireBucket();

  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`created bucket "${bucket}"`);
  } catch (err) {
    const code = (err as { Code?: string }).Code;
    if (code === "BucketAlreadyOwnedByYou" || code === "BucketAlreadyExists") {
      console.log(`bucket "${bucket}" already exists`);
    } else {
      throw err;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
