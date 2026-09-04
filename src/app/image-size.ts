export type ImageSizeBasis = "diagonal" | "long-side" | "short-side";

export const IMAGE_SIZE_BASIS_LABELS: Record<ImageSizeBasis, string> = {
  diagonal: "対角線",
  "long-side": "長辺",
  "short-side": "短辺",
};

export function parseImageSizeBasis(value: string | null): ImageSizeBasis {
  return value === "long-side" || value === "short-side" ? value : "diagonal";
}

export function getRotatedDimensions(
  width: number,
  height: number,
  rotationDegrees: number,
) {
  const rotationRadians = (Math.abs(rotationDegrees) * Math.PI) / 180;
  // 傾きが往復する途中も含めて、最大の横幅・高さを確保します。
  const widthAngle = Math.min(rotationRadians, Math.atan2(height, width));
  const heightAngle = Math.min(rotationRadians, Math.atan2(width, height));

  return {
    width: width * Math.cos(widthAngle) + height * Math.sin(widthAngle),
    height: height * Math.cos(heightAngle) + width * Math.sin(heightAngle),
  };
}

export function getImageSize({
  requestedSizePx,
  basis,
  naturalWidth,
  naturalHeight,
  viewportWidth,
  viewportHeight,
  driftX,
  driftY,
  rotation,
  edgeGapPx,
}: {
  requestedSizePx: number;
  basis: ImageSizeBasis;
  naturalWidth: number;
  naturalHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  driftX: number;
  driftY: number;
  rotation: number;
  edgeGapPx: number;
}) {
  const naturalDiagonal = Math.hypot(naturalWidth, naturalHeight);
  const basisLength =
    basis === "long-side"
      ? Math.max(naturalWidth, naturalHeight)
      : basis === "short-side"
        ? Math.min(naturalWidth, naturalHeight)
        : naturalDiagonal;
  const imageWidthRatio = naturalWidth / naturalDiagonal;
  const imageHeightRatio = naturalHeight / naturalDiagonal;
  const rotatedRatios = getRotatedDimensions(
    imageWidthRatio,
    imageHeightRatio,
    rotation,
  );
  const availableWidth = Math.max(
    1,
    viewportWidth * (1 - (2 * Math.abs(driftX)) / 100) - 2 * edgeGapPx,
  );
  const availableHeight = Math.max(
    1,
    viewportHeight * (1 - (2 * Math.abs(driftY)) / 100) - 2 * edgeGapPx,
  );
  const maximumSafeDiagonalPx = Math.min(
    availableWidth / rotatedRatios.width,
    availableHeight / rotatedRatios.height,
  );

  return {
    diagonalPx: Math.min(
      (requestedSizePx * naturalDiagonal) / basisLength,
      maximumSafeDiagonalPx,
    ),
    maximumSafeDiagonalPx,
    diagonalScale: Math.max(imageWidthRatio, imageHeightRatio),
    imageWidthRatio,
    imageHeightRatio,
  };
}
