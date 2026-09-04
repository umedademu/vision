import {
  DeleteObjectCommand,
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

export async function DELETE(request: Request) {
  const config = getR2Config();

  if (!config) {
    return NextResponse.json(
      { error: "画像を削除するための設定が完了していません。" },
      { status: 503 },
    );
  }

  let body: { key?: string };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "削除する画像の情報を読み取れませんでした。" },
      { status: 400 },
    );
  }

  const key = body.key?.trim() ?? "";

  if (!key || key.length > 1_024 || !IMAGE_FILE_PATTERN.test(key)) {
    return NextResponse.json(
      { error: "削除する画像を確認できませんでした。" },
      { status: 400 },
    );
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

    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      }),
    );

    return NextResponse.json({ key });
  } catch (error) {
    console.error("R2から画像を削除できませんでした。", error);
    return NextResponse.json(
      { error: "画像を削除できませんでした。" },
      { status: 500 },
    );
  }
}
