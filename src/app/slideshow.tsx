"use client";

import Link from "next/link";
import type { ChangeEvent, CSSProperties, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

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

type FloatingItem = {
  id: string;
  imageIndex: number;
  x: number;
  y: number;
  sizePercent: number;
  driftX: number;
  driftY: number;
  floatDurationMs: number;
  floatDelayMs: number;
  rotation: number;
  layer: number;
};

const DEFAULT_MAX_DISPLAY_COUNT = 12;
const MIN_CONFIGURABLE_DISPLAY_COUNT = 1;
const MAX_CONFIGURABLE_DISPLAY_COUNT = 12;
const PLACEMENT_AREA_COUNT = 12;
const DISPLAY_COUNT_STORAGE_KEY = "vision-maximum-display-count";
const MIN_DISPLAY_INTERVAL_MS = 5_000;
const MAX_DISPLAY_INTERVAL_MS = 10_000;

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSignedInteger(min: number, max: number) {
  const value = randomInteger(min, max);
  return Math.random() < 0.5 ? -value : value;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getMinimumDisplayCount(maximumDisplayCount: number) {
  return Math.max(1, Math.round(maximumDisplayCount * 0.7));
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

function createInitialIndexes(imageCount: number, displayCount: number) {
  if (imageCount === 0) {
    return [];
  }

  const indexes: number[] = [];

  while (indexes.length < displayCount) {
    const shuffled = shuffleIndexes(imageCount);

    for (const index of shuffled) {
      indexes.push(index);

      if (indexes.length === displayCount) {
        break;
      }
    }
  }

  return indexes;
}

function createFloatingItems(
  imageCount: number,
  viewportWidth: number,
  maximumDisplayCount: number,
) {
  const displayCount = randomInteger(
    getMinimumDisplayCount(maximumDisplayCount),
    maximumDisplayCount,
  );
  const isMobile = viewportWidth <= 640;
  const isTablet = viewportWidth > 640 && viewportWidth <= 1_000;
  const columns = isMobile ? 3 : 4;
  const rows = isMobile ? 4 : 3;
  const jitterX = isMobile ? 1 : isTablet ? 5 : 4;
  const jitterY = isMobile ? 3 : isTablet ? 2 : 4;
  const minimumX = isMobile ? 17 : isTablet ? 8 : 10;
  const minimumY = isMobile ? 10 : isTablet ? 17 : 12;
  const placementIndexes = shuffleIndexes(PLACEMENT_AREA_COUNT).slice(
    0,
    displayCount,
  );

  return createInitialIndexes(imageCount, displayCount).map(
    (imageIndex, slotIndex) => {
      const floatDurationMs = randomInteger(7_000, 15_000);
      const placementIndex = placementIndexes[slotIndex];
      const column = placementIndex % columns;
      const row = Math.floor(placementIndex / columns);
      const anchorX = ((column + 0.5) / columns) * 100;
      const anchorY = ((row + 0.5) / rows) * 100;

      return {
        id: `${Date.now()}-${slotIndex}-${Math.random()}`,
        imageIndex,
        x: clamp(
          anchorX + randomSignedInteger(0, jitterX),
          minimumX,
          100 - minimumX,
        ),
        y: clamp(
          anchorY + randomSignedInteger(0, jitterY),
          minimumY,
          100 - minimumY,
        ),
        sizePercent: randomInteger(80, 100),
        driftX: randomSignedInteger(1, 2),
        driftY: randomSignedInteger(1, 2),
        floatDurationMs,
        floatDelayMs: -randomInteger(0, floatDurationMs),
        rotation: randomSignedInteger(1, 4),
        layer: randomInteger(1, 5),
      } satisfies FloatingItem;
    },
  );
}

function chooseNextIndex(
  currentIndex: number,
  imageCount: number,
  visibleIndexes: number[],
) {
  if (imageCount < 2) {
    return currentIndex;
  }

  const otherIndexes = Array.from(
    { length: imageCount },
    (_, index) => index,
  ).filter((index) => index !== currentIndex);
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
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);
  const [maximumDisplayCount, setMaximumDisplayCount] = useState(
    DEFAULT_MAX_DISPLAY_COUNT,
  );
  const [draftMaximumDisplayCount, setDraftMaximumDisplayCount] = useState(
    String(DEFAULT_MAX_DISPLAY_COUNT),
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const savedMaximumDisplayCount = Number.parseInt(
      window.localStorage.getItem(DISPLAY_COUNT_STORAGE_KEY) ?? "",
      10,
    );
    const initialMaximumDisplayCount = Number.isNaN(savedMaximumDisplayCount)
      ? DEFAULT_MAX_DISPLAY_COUNT
      : clamp(
          savedMaximumDisplayCount,
          MIN_CONFIGURABLE_DISPLAY_COUNT,
          MAX_CONFIGURABLE_DISPLAY_COUNT,
        );

    void fetchImages(controller.signal).then((loadedImages) => {
      if (controller.signal.aborted) {
        return;
      }

      setMaximumDisplayCount(initialMaximumDisplayCount);
      setDraftMaximumDisplayCount(String(initialMaximumDisplayCount));

      if (loadedImages) {
        setImages(loadedImages);
        setFloatingItems(
          createFloatingItems(
            loadedImages.length,
            window.innerWidth,
            initialMaximumDisplayCount,
          ),
        );
      }
    });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (images.length < 2 || floatingItems.length === 0) {
      return;
    }

    const timers: number[] = [];

    function scheduleChange(slotIndex: number) {
      timers[slotIndex] = window.setTimeout(() => {
        setFloatingItems((currentItems) => {
          const currentItem = currentItems[slotIndex];

          if (!currentItem) {
            return currentItems;
          }

          const nextItems = [...currentItems];
          nextItems[slotIndex] = {
            ...currentItem,
            imageIndex: chooseNextIndex(
              currentItem.imageIndex,
              images.length,
              currentItems.map((item) => item.imageIndex),
            ),
            sizePercent: randomInteger(80, 100),
          };
          return nextItems;
        });
        scheduleChange(slotIndex);
      }, randomInteger(MIN_DISPLAY_INTERVAL_MS, MAX_DISPLAY_INTERVAL_MS));
    }

    for (let slotIndex = 0; slotIndex < floatingItems.length; slotIndex += 1) {
      scheduleChange(slotIndex);
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [images.length, floatingItems.length]);

  function handleDisplaySettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const enteredMaximumDisplayCount = Number.parseInt(
      draftMaximumDisplayCount,
      10,
    );
    const nextMaximumDisplayCount = Number.isNaN(enteredMaximumDisplayCount)
      ? maximumDisplayCount
      : clamp(
          enteredMaximumDisplayCount,
          MIN_CONFIGURABLE_DISPLAY_COUNT,
          MAX_CONFIGURABLE_DISPLAY_COUNT,
        );

    window.localStorage.setItem(
      DISPLAY_COUNT_STORAGE_KEY,
      String(nextMaximumDisplayCount),
    );
    setMaximumDisplayCount(nextMaximumDisplayCount);
    setDraftMaximumDisplayCount(String(nextMaximumDisplayCount));
    setFloatingItems(
      createFloatingItems(
        images.length,
        window.innerWidth,
        nextMaximumDisplayCount,
      ),
    );
    setIsSettingsOpen(false);
  }

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
        const nextItems = createFloatingItems(
          refreshedImages.length,
          window.innerWidth,
          maximumDisplayCount,
        );
        const uploadedIndex = refreshedImages.findIndex(
          (image) => image.key === lastUploadedKey,
        );

        if (uploadedIndex >= 0 && nextItems[0]) {
          nextItems[0] = { ...nextItems[0], imageIndex: uploadedIndex };
        }

        setFloatingItems(nextItems);
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
      {floatingItems.length > 0 ? (
        <div className="floating-stage">
          {floatingItems.map((item) => {
            const image = images[item.imageIndex];
            const floatingStyle = {
              left: `${item.x}%`,
              top: `${item.y}%`,
              zIndex: item.layer,
              "--drift-x-start": `${-item.driftX}vw`,
              "--drift-y-start": `${-item.driftY}svh`,
              "--drift-x": `${item.driftX}vw`,
              "--drift-y": `${item.driftY}svh`,
              "--float-duration": `${item.floatDurationMs}ms`,
              "--float-delay": `${item.floatDelayMs}ms`,
              "--rotation-start": `${-item.rotation}deg`,
              "--rotation": `${item.rotation}deg`,
            } as CSSProperties;

            return (
              <div
                className="floating-slot"
                key={item.id}
                style={floatingStyle}
              >
                <div className="floating-motion">
                  {/* R2の署名付きURLをブラウザから直接読み込みます。 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={image.key}
                    className="slideshow-image"
                    src={image.url}
                    alt=""
                    style={{
                      width: `${item.sizePercent}%`,
                      height: `${item.sizePercent}%`,
                    }}
                  />
                </div>
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

      <button
        className="settings-button"
        type="button"
        aria-controls="display-settings"
        aria-expanded={isSettingsOpen}
        onClick={() => setIsSettingsOpen((isOpen) => !isOpen)}
      >
        表示枚数 {getMinimumDisplayCount(maximumDisplayCount)}〜
        {maximumDisplayCount}
      </button>

      {isSettingsOpen && (
        <form
          id="display-settings"
          className="settings-panel"
          onSubmit={handleDisplaySettings}
        >
          <label className="settings-label" htmlFor="maximum-display-count">
            最大枚数
            <input
              id="maximum-display-count"
              className="settings-input"
              type="number"
              min={MIN_CONFIGURABLE_DISPLAY_COUNT}
              max={MAX_CONFIGURABLE_DISPLAY_COUNT}
              step="1"
              required
              value={draftMaximumDisplayCount}
              onChange={(event) =>
                setDraftMaximumDisplayCount(event.target.value)
              }
            />
          </label>
          <p className="settings-description">
            最小枚数は、最大枚数から30%減らして自動設定します。
          </p>
          <button className="settings-submit" type="submit">
            反映する
          </button>
        </form>
      )}

      <Link className="updates-link" href="/updates">
        更新情報
      </Link>
    </main>
  );
}
