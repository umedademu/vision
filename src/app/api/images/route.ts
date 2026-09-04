import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const IMAGE_FILE_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;
const SIGNED_URL_EXPIRES_IN_SECONDS = 24 * 60 * 60;

function getR2Config() {
  const config = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
  };

  if (Object.values(config).some((value) => !value)) {
    return null;
  }

  return config as Record<keyof typeof config, string>;
}

export async function GET() {
  const config = getR2Config();

  if (!config) {
    return NextResponse.json({ images: [] });
  }

  try {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        MaxKeys: 1_000,
      }),
    );

    const objects = (result.Contents ?? []).filter(
      (object) => object.Key && object.Size && IMAGE_FILE_PATTERN.test(object.Key),
    );

    const images = await Promise.all(
      objects.map(async (object) => ({
        key: object.Key as string,
        url: await getSignedUrl(
          client,
          new GetObjectCommand({
            Bucket: config.bucketName,
            Key: object.Key,
          }),
          { expiresIn: SIGNED_URL_EXPIRES_IN_SECONDS },
        ),
      })),
    );

    return NextResponse.json(
      { images },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("R2から画像一覧を取得できませんでした。", error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
