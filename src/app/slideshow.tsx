"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";

type ImageItem = {
  key: string;
  url: string;
};

type ImagesResponse = {
  images: ImageItem[];
};

type UploadUrlResponse = {
  error?: string;
  key?: string;
  uploadUrl?: string;
};

const DISPLAY_SLOT_COUNT = 12;
const MIN_DISPLAY_INTERVAL_MS = 5_000;
const MAX_DISPLAY_INTERVAL_MS = 10_000;

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleIndexes(imageCount: number) {
  const indexes = Array.from({ length: imageCount }, (_, index) => index);

  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(0, index);
    [indexes[index], indexes[swapIndex]] = [
      indexes[swapIndex],
      indexes[index],
    ];
  }

  return indexes;
}

function createInitialIndexes(imageCount: number) {
  if (imageCount === 0) {
    return [];
  }

  const indexes: number[] = [];

  while (indexes.length < DISPLAY_SLOT_COUNT) {
    const shuffled = shuffleIndexes(imageCount);

    for (const index of shuffled) {
      indexes.push(index);

      if (indexes.length === DISPLAY_SLOT_COUNT) {
        break;
      }
    }
  }

  return indexes;
}

function chooseNextIndex(
  currentIndex: number,
  imageCount: number,
  visibleIndexes: number[],
) {
  if (imageCount < 2) {
    return currentIndex;
  }

  const otherIndexes = Array.from({ length: imageCount }, (_, index) => index).filter(
    (index) => index !== currentIndex,
  );
  const unusedIndexes = otherIndexes.filter(
    (index) => !visibleIndexes.includes(index),
  );
  const candidates = unusedIndexes.length > 0 ? unusedIndexes : otherIndexes;

  return candidates[randomInteger(0, candidates.length - 1)];
}

async function fetchImages(signal?: AbortSignal) {
  try {
    const response = await fetch("/api/images", {
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ImagesResponse;
    return data.images;
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      console.error("画像の読み込みに失敗しました。", error);
    }

    return null;
  }
}

export function Slideshow() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchImages(controller.signal).then((loadedImages) => {
      if (loadedImages) {
        setImages(loadedImages);
        setVisibleIndexes(createInitialIndexes(loadedImages.length));
      }
    });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (images.length < 2 || visibleIndexes.length === 0) {
      return;
    }

    const timers: number[] = [];

    function scheduleChange(slotIndex: number) {
      timers[slotIndex] = window.setTimeout(() => {
        setVisibleIndexes((currentIndexes) => {
          const nextIndexes = [...currentIndexes];
          nextIndexes[slotIndex] = chooseNextIndex(
            currentIndexes[slotIndex],
            images.length,
            currentIndexes,
          );
          return nextIndexes;
        });
        scheduleChange(slotIndex);
      }, randomInteger(MIN_DISPLAY_INTERVAL_MS, MAX_DISPLAY_INTERVAL_MS));
    }

    for (let slotIndex = 0; slotIndex < DISPLAY_SLOT_COUNT; slotIndex += 1) {
      scheduleChange(slotIndex);
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [images.length, visibleIndexes.length]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      let lastUploadedKey = "";

      for (const [index, file] of selectedFiles.entries()) {
        setUploadMessage(
          `${selectedFiles.length}枚中${index + 1}枚目を追加しています…`,
        );

        const prepareResponse = await fetch("/api/uploads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ contentType: file.type, size: file.size }),
        });
        const prepared = (await prepareResponse.json()) as UploadUrlResponse;

        if (!prepareResponse.ok || !prepared.uploadUrl || !prepared.key) {
          throw new Error(prepared.error ?? "画像を追加できませんでした。");
        }

        const uploadResponse = await fetch(prepared.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("画像の保存に失敗しました。");
        }

        lastUploadedKey = prepared.key;
      }

      const refreshedImages = await fetchImages();
      if (refreshedImages) {
        setImages(refreshedImages);
        const nextIndexes = createInitialIndexes(refreshedImages.length);
        const uploadedIndex = refreshedImages.findIndex(
          (image) => image.key === lastUploadedKey,
        );

        if (uploadedIndex >= 0) {
          nextIndexes[0] = uploadedIndex;
        }

        setVisibleIndexes(nextIndexes);
      }

      setUploadMessage(`${selectedFiles.length}枚の画像を追加しました。`);
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : "画像を追加できませんでした。",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="slideshow">
      {visibleIndexes.length > 0 ? (
        <div className="slideshow-grid">
          {visibleIndexes.map((imageIndex, slotIndex) => {
            const image = images[imageIndex];

            return (
              <div className="slideshow-tile" key={slotIndex}>
                {/* R2の署名付きURLをブラウザから直接読み込みます。 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={image.key}
                  className="slideshow-image"
                  src={image.url}
                  alt=""
                />
              </div>
            );
          })}
        </div>
      ) : (
        <h1 className="slideshow-title">vision</h1>
      )}

      <input
        ref={fileInputRef}
        className="upload-input"
        type="file"
        accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
        multiple
        onChange={handleUpload}
      />
      <button
        className="upload-button"
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? "追加中…" : "画像を追加"}
      </button>

      {uploadMessage && (
        <p className="upload-message" role="status">
          {uploadMessage}
        </p>
      )}

      <Link className="updates-link" href="/updates">
        更新情報
      </Link>
    </main>
  );
}
