import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const UPLOAD_URL_EXPIRES_IN_SECONDS = 5 * 60;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

export async function POST(request: Request) {
  const config = getR2Config();

  if (!config) {
    return NextResponse.json(
      { error: "画像を追加するための設定が完了していません。" },
      { status: 503 },
    );
  }

  let body: { contentType?: string; size?: number };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "画像の情報を読み取れませんでした。" },
      { status: 400 },
    );
  }

  const contentType = body.contentType ?? "";
  const extension = IMAGE_EXTENSIONS[contentType];

  if (!extension) {
    return NextResponse.json(
      { error: "この画像形式には対応していません。" },
      { status: 415 },
    );
  }

  if (!body.size || body.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "画像は1枚25MB以下にしてください。" },
      { status: 413 },
    );
  }

  const key = `images/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
    { expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS },
  );

  return NextResponse.json({ key, uploadUrl });
}
