"use client";

import { useId } from "react";
import type { ImageItem } from "@/lib/image-crop";

type StoredImageProps = {
  image: ImageItem;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  onLoad?: (width: number, height: number) => void;
};

export function StoredImage({ image, alt, className, loading, onLoad }: StoredImageProps) {
  const clipId = useId();
  const crop = image.crop;

  if (!crop) {
    return (
      // R2の署名付きURLを直接表示します。
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={className}
        src={image.url}
        alt={alt}
        loading={loading}
        onLoad={(event) => onLoad?.(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
      />
    );
  }

  return (
    <svg
      className={className}
      viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}
      preserveAspectRatio="xMidYMid meet"
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      focusable="false"
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <rect x={crop.x} y={crop.y} width={crop.width} height={crop.height} />
        </clipPath>
      </defs>
      <image
        href={image.url}
        width={crop.sourceWidth}
        height={crop.sourceHeight}
        clipPath={`url(#${clipId})`}
        onLoad={() => onLoad?.(crop.width, crop.height)}
      />
    </svg>
  );
}
