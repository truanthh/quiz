import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config.js";
import { createS3Client, requireBucket } from "./s3Client.js";

const UPLOAD_URL_TTL_SECONDS = 300;

export async function createUploadUrl(key: string, contentType: string): Promise<string> {
  const client = createS3Client();
  const command = new PutObjectCommand({ Bucket: requireBucket(), Key: key, ContentType: contentType });
  return getSignedUrl(client, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const client = createS3Client();
  const command = new GetObjectCommand({ Bucket: requireBucket(), Key: key });
  const response = await client.send(command);
  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) throw new Error(`object ${key} has no body`);
  return Buffer.from(bytes);
}

export async function uploadBuffer(key: string, body: Buffer, contentType: string): Promise<void> {
  const client = createS3Client();
  await client.send(
    new PutObjectCommand({ Bucket: requireBucket(), Key: key, Body: body, ContentType: contentType }),
  );
}

export function publicUrlFor(key: string): string {
  if (!config.s3.publicUrl) throw new Error("S3_PUBLIC_URL is not configured");
  return `${config.s3.publicUrl.replace(/\/$/, "")}/${key}`;
}
