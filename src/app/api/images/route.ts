import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  type _Object as R2Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { isImageCrop, type ImageCrop } from "@/lib/image-crop";
import { getCropKey, getR2Storage, IMAGE_FILE_PATTERN } from "@/lib/r2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SIGNED_URL_EXPIRES_IN_SECONDS = 24 * 60 * 60;

export async function GET() {
  const storage = getR2Storage();

  if (!storage) {
    return NextResponse.json({ images: [] });
  }

  try {
    const { client, bucketName } = storage;
    const allObjects: R2Object[] = [];
    let continuationToken: string | undefined;
    do {
      const result = await client.send(new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1_000,
        ContinuationToken: continuationToken,
      }));
      allObjects.push(...(result.Contents ?? []));
      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (continuationToken);

    const storedKeys = new Set(allObjects.map((object) => object.Key));
    const objects = allObjects.filter(
      (object) => object.Key && object.Size && IMAGE_FILE_PATTERN.test(object.Key),
    );

    const images = await Promise.all(
      objects.map(async (object) => {
        const key = object.Key as string;
        let crop: ImageCrop | undefined;
        if (storedKeys.has(getCropKey(key))) {
          try {
            const saved = await client.send(new GetObjectCommand({ Bucket: bucketName, Key: getCropKey(key) }));
            const metadata = JSON.parse(await saved.Body!.transformToString());
            if (metadata?.sourceETag === object.ETag && isImageCrop(metadata?.crop)) {
              crop = metadata.crop;
            }
          } catch (error) {
            if (!(error instanceof Error && error.name === "NoSuchKey")) throw error;
          }
        }
        return {
          key,
          crop,
          url: await getSignedUrl(
            client,
            new GetObjectCommand({
              Bucket: bucketName,
              Key: object.Key,
            }),
            { expiresIn: SIGNED_URL_EXPIRES_IN_SECONDS },
          ),
        };
      }),
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
  const storage = getR2Storage();

  if (!storage) {
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
    const { client, bucketName } = storage;

    const deleted = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: [{ Key: key }, { Key: getCropKey(key) }] },
      }),
    );
    if (deleted.Errors?.length) throw new Error("画像または切り抜き範囲を削除できませんでした。");

    return NextResponse.json({ key });
  } catch (error) {
    console.error("R2から画像を削除できませんでした。", error);
    return NextResponse.json(
      { error: "画像を削除できませんでした。" },
      { status: 500 },
    );
  }
}
