export type ImageCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
};

export type ImageItem = {
  key: string;
  url: string;
  crop?: ImageCrop;
};

export function isImageCrop(value: unknown): value is ImageCrop {
  if (!value || typeof value !== "object") return false;
  const crop = value as ImageCrop;
  const values = [crop.x, crop.y, crop.width, crop.height, crop.sourceWidth, crop.sourceHeight];

  return (
    values.every((number) => Number.isSafeInteger(number)) &&
    crop.sourceWidth > 0 && crop.sourceWidth <= 100_000 &&
    crop.sourceHeight > 0 && crop.sourceHeight <= 100_000 &&
    crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0 &&
    crop.x + crop.width <= crop.sourceWidth &&
    crop.y + crop.height <= crop.sourceHeight
  );
}

export function toImageCrop(
  percent: { x: number; y: number; width: number; height: number },
  sourceWidth: number,
  sourceHeight: number,
): ImageCrop {
  const x = Math.max(0, Math.min(sourceWidth - 1, Math.round(percent.x * sourceWidth / 100)));
  const y = Math.max(0, Math.min(sourceHeight - 1, Math.round(percent.y * sourceHeight / 100)));
  const right = Math.min(sourceWidth, Math.round((percent.x + percent.width) * sourceWidth / 100));
  const bottom = Math.min(sourceHeight, Math.round((percent.y + percent.height) * sourceHeight / 100));

  return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y), sourceWidth, sourceHeight };
}
