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
  slotWidthPercent: number;
  slotHeightPercent: number;
  floatDurationMs: number;
  floatDelayMs: number;
  rotation: number;
  layer: number;
};

const DEFAULT_MAX_DISPLAY_COUNT = 12;
const MIN_CONFIGURABLE_DISPLAY_COUNT = 1;
const MAX_CONFIGURABLE_DISPLAY_COUNT = 100;
const DISPLAY_COUNT_STORAGE_KEY = "vision-maximum-display-count";
const EDGE_GAP_PX = 8;
const MIN_DISPLAY_INTERVAL_MS = 5_000;
const MAX_DISPLAY_INTERVAL_MS = 10_000;

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSignedInteger(min: number, max: number) {
  const value = randomInteger(min, max);
  return Math.random() < 0.5 ? -value : value;
}

function randomSignedNumber(min: number, max: number) {
  const value = Math.random() * (max - min) + min;
  const signedValue = Math.random() < 0.5 ? -value : value;
  return Math.round(signedValue * 1_000) / 1_000;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getMinimumDisplayCount(maximumDisplayCount: number) {
  return Math.max(1, Math.round(maximumDisplayCount * 0.7));
}

function getBaseSlotSize(viewportWidth: number) {
  if (viewportWidth <= 640) {
    return { heightPercent: 15, widthPercent: 30 };
  }

  if (viewportWidth <= 1_000) {
    return { heightPercent: 30, widthPercent: 12 };
  }

  return { heightPercent: 20, widthPercent: 15 };
}

function getSafeEdgeMargins(
  viewportWidth: number,
  viewportHeight: number,
  rotation: number,
  driftX: number,
  driftY: number,
  slotWidthPercent: number,
  slotHeightPercent: number,
) {
  const slotWidth = viewportWidth * (slotWidthPercent / 100);
  const slotHeight = viewportHeight * (slotHeightPercent / 100);
  const rotationRadians = (Math.abs(rotation) * Math.PI) / 180;
  const rotatedWidth =
    slotWidth * Math.cos(rotationRadians) +
    slotHeight * Math.sin(rotationRadians);
  const rotatedHeight =
    slotHeight * Math.cos(rotationRadians) +
    slotWidth * Math.sin(rotationRadians);

  return {
    x:
      ((rotatedWidth / 2 +
        viewportWidth * (Math.abs(driftX) / 100) +
        EDGE_GAP_PX) /
        viewportWidth) *
      100,
    y:
      ((rotatedHeight / 2 +
        viewportHeight * (Math.abs(driftY) / 100) +
        EDGE_GAP_PX) /
        viewportHeight) *
      100,
  };
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
  viewportHeight: number,
  maximumDisplayCount: number,
) {
  const displayCount = randomInteger(
    getMinimumDisplayCount(maximumDisplayCount),
    maximumDisplayCount,
  );
  const isMobile = viewportWidth <= 640;
  const layoutRatio = isMobile ? 3 / 4 : 4 / 3;
  const columns =
    displayCount === 1
      ? 1
      : Math.ceil(Math.sqrt(displayCount * layoutRatio));
  const rows = Math.ceil(displayCount / columns);
  const cellWidthPercent = 100 / columns;
  const cellHeightPercent = 100 / rows;
  const layoutScale = Math.min(
    1,
    Math.sqrt(DEFAULT_MAX_DISPLAY_COUNT / displayCount),
  );
  const baseSlotSize = getBaseSlotSize(viewportWidth);
  const slotWidthPercent = baseSlotSize.widthPercent * layoutScale;
  const slotHeightPercent = baseSlotSize.heightPercent * layoutScale;
  const minimumDriftX = Math.min(1, Math.max(0.25, cellWidthPercent * 0.04));
  const maximumDriftX = Math.min(2, Math.max(0.5, cellWidthPercent * 0.08));
  const minimumDriftY = Math.min(1, Math.max(0.25, cellHeightPercent * 0.04));
  const maximumDriftY = Math.min(2, Math.max(0.5, cellHeightPercent * 0.08));
  const placementIndexes = shuffleIndexes(columns * rows).slice(
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
      const sizePercent = randomInteger(80, 100);
      const driftX = randomSignedNumber(minimumDriftX, maximumDriftX);
      const driftY = randomSignedNumber(minimumDriftY, maximumDriftY);
      const rotation = randomSignedInteger(1, 4);
      const safeEdgeMargins = getSafeEdgeMargins(
        viewportWidth,
        viewportHeight,
        rotation,
        driftX,
        driftY,
        slotWidthPercent,
        slotHeightPercent,
      );
      const maximumJitterX = Math.max(
        0,
        cellWidthPercent / 2 - safeEdgeMargins.x,
      );
      const maximumJitterY = Math.max(
        0,
        cellHeightPercent / 2 - safeEdgeMargins.y,
      );

      return {
        id: `${Date.now()}-${slotIndex}-${Math.random()}`,
        imageIndex,
        x: clamp(
          anchorX + randomSignedNumber(0, maximumJitterX),
          safeEdgeMargins.x,
          100 - safeEdgeMargins.x,
        ),
        y: clamp(
          anchorY + randomSignedNumber(0, maximumJitterY),
          safeEdgeMargins.y,
          100 - safeEdgeMargins.y,
        ),
        sizePercent,
        driftX,
        driftY,
        slotWidthPercent,
        slotHeightPercent,
        floatDurationMs,
        floatDelayMs: -randomInteger(0, floatDurationMs),
        rotation,
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
            window.innerHeight,
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

  useEffect(() => {
    if (images.length === 0) {
      return;
    }

    let resizeTimer: number | undefined;

    function handleResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setFloatingItems(
          createFloatingItems(
            images.length,
            window.innerWidth,
            window.innerHeight,
            maximumDisplayCount,
          ),
        );
      }, 200);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(resizeTimer);
    };
  }, [images.length, maximumDisplayCount]);

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
        window.innerHeight,
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
          window.innerHeight,
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
              "--slot-width": `${item.slotWidthPercent}vw`,
              "--slot-height": `${item.slotHeightPercent}svh`,
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
