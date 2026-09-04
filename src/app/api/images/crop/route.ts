import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { isImageCrop } from "@/lib/image-crop";
import { getCropKey, getR2Storage, IMAGE_FILE_PATTERN } from "@/lib/r2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(request: Request) {
  const storage = getR2Storage();
  if (!storage) {
    return NextResponse.json({ error: "画像を保存するための設定が完了していません。" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "切り抜き範囲を読み取れませんでした。" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("key" in body) || !("crop" in body) ||
    typeof body.key !== "string" || !body.key || body.key.length > 1_024 ||
    !IMAGE_FILE_PATTERN.test(body.key) || !isImageCrop(body.crop)) {
    return NextResponse.json({ error: "切り抜き範囲を確認してください。" }, { status: 400 });
  }

  const { key, crop } = body;
  const { client, bucketName } = storage;

  try {
    const original = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    // 元画像は変更せず、表示する範囲だけを別に保存します。
    await client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: getCropKey(key),
      Body: JSON.stringify({ crop, sourceETag: original.ETag }),
      ContentType: "application/json",
      CacheControl: "private, no-store",
    }));

    return NextResponse.json({ key, crop }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && (error.name === "NotFound" || error.name === "NoSuchKey")) {
      return NextResponse.json({ error: "画像が見つかりません。画像一覧を開き直してください。" }, { status: 404 });
    }
    console.error("切り抜き範囲を保存できませんでした。", error);
    return NextResponse.json({ error: "保存できませんでした。もう一度お試しください。" }, { status: 500 });
  }
}
