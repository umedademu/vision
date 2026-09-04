import { createHash } from "node:crypto";
import { S3Client } from "@aws-sdk/client-s3";

export const IMAGE_FILE_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;

export function getCropKey(imageKey: string) {
  return `.vision-crops/${createHash("sha256").update(imageKey).digest("hex")}.json`;
}

export function getR2Storage() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) return null;

  return {
    bucketName,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}
