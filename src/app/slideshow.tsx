"use client";

import Link from "next/link";
import type {
  ChangeEvent,
  CSSProperties,
  FormEvent,
  SyntheticEvent,
} from "react";
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
  diagonalPx: number;
  maximumSafeDiagonalPx: number;
  diagonalScale: number;
  driftX: number;
  driftY: number;
  floatDurationMs: number;
  floatDelayMs: number;
  rotation: number;
  layer: number;
};

type SlideshowSettings = {
  minimumDisplayCount: number;
  maximumDisplayCount: number;
  minimumSwitchSeconds: number;
  maximumSwitchSeconds: number;
  minimumImageDiagonalPx: number;
  maximumImageDiagonalPx: number;
};

type DraftSlideshowSettings = {
  minimumDisplayCount: string;
  maximumDisplayCount: string;
  minimumSwitchSeconds: string;
  maximumSwitchSeconds: string;
  minimumImageDiagonalPx: string;
  maximumImageDiagonalPx: string;
};

const DEFAULT_MIN_DISPLAY_COUNT = 8;
const DEFAULT_MAX_DISPLAY_COUNT = 12;
const DEFAULT_MIN_SWITCH_SECONDS = 5;
const DEFAULT_MAX_SWITCH_SECONDS = 10;
const DEFAULT_MIN_IMAGE_DIAGONAL_PX = 160;
const DEFAULT_MAX_IMAGE_DIAGONAL_PX = 280;
const MIN_CONFIGURABLE_DISPLAY_COUNT = 1;
const MAX_CONFIGURABLE_DISPLAY_COUNT = 100;
const MIN_CONFIGURABLE_SWITCH_SECONDS = 1;
const MAX_CONFIGURABLE_SWITCH_SECONDS = 3_600;
const MIN_CONFIGURABLE_IMAGE_DIAGONAL_PX = 16;
const MAX_CONFIGURABLE_IMAGE_DIAGONAL_PX = 4_000;
const MIN_DISPLAY_COUNT_STORAGE_KEY = "vision-minimum-display-count";
const MAX_DISPLAY_COUNT_STORAGE_KEY = "vision-maximum-display-count";
const MIN_SWITCH_SECONDS_STORAGE_KEY = "vision-minimum-switch-seconds";
const MAX_SWITCH_SECONDS_STORAGE_KEY = "vision-maximum-switch-seconds";
const MIN_IMAGE_DIAGONAL_STORAGE_KEY = "vision-minimum-image-diagonal-px";
const MAX_IMAGE_DIAGONAL_STORAGE_KEY = "vision-maximum-image-diagonal-px";
const LEGACY_MIN_IMAGE_LONG_SIDE_STORAGE_KEY =
  "vision-minimum-image-long-side-px";
const LEGACY_MAX_IMAGE_LONG_SIDE_STORAGE_KEY =
  "vision-maximum-image-long-side-px";
const EDGE_GAP_PX = 8;
const CONTROLS_VISIBLE_MS = 8_000;

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

function getLegacyMinimumDisplayCount(maximumDisplayCount: number) {
  return Math.max(1, Math.round(maximumDisplayCount * 0.7));
}

function getSafeEdgeMargins(
  viewportWidth: number,
  viewportHeight: number,
  driftX: number,
  driftY: number,
  diagonalPx: number,
) {
  return {
    x:
      ((diagonalPx / 2 +
        viewportWidth * (Math.abs(driftX) / 100) +
        EDGE_GAP_PX) /
        viewportWidth) *
      100,
    y:
      ((diagonalPx / 2 +
        viewportHeight * (Math.abs(driftY) / 100) +
        EDGE_GAP_PX) /
        viewportHeight) *
      100,
  };
}

function getMaximumSafeDiagonalPx(
  viewportWidth: number,
  viewportHeight: number,
  cellWidthPercent: number,
  cellHeightPercent: number,
  driftX: number,
  driftY: number,
) {
  const horizontalDriftPx = viewportWidth * (Math.abs(driftX) / 100);
  const verticalDriftPx = viewportHeight * (Math.abs(driftY) / 100);
  const cellWidthPx = viewportWidth * (cellWidthPercent / 100);
  const cellHeightPx = viewportHeight * (cellHeightPercent / 100);
  const availableCellWidth = cellWidthPx * 1.25 - horizontalDriftPx * 2;
  const availableCellHeight = cellHeightPx * 1.25 - verticalDriftPx * 2;
  const availableViewportWidth =
    viewportWidth - horizontalDriftPx * 2 - EDGE_GAP_PX * 2;
  const availableViewportHeight =
    viewportHeight - verticalDriftPx * 2 - EDGE_GAP_PX * 2;

  return Math.max(
    1,
    Math.floor(
      Math.min(
        availableCellWidth,
        availableCellHeight,
        availableViewportWidth,
        availableViewportHeight,
      ),
    ),
  );
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
  settings: SlideshowSettings,
) {
  const displayCount = randomInteger(
    settings.minimumDisplayCount,
    settings.maximumDisplayCount,
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
      const requestedDiagonalPx = randomInteger(
        settings.minimumImageDiagonalPx,
        settings.maximumImageDiagonalPx,
      );
      const driftX = randomSignedNumber(minimumDriftX, maximumDriftX);
      const driftY = randomSignedNumber(minimumDriftY, maximumDriftY);
      const rotation = randomSignedInteger(1, 4);
      const maximumSafeDiagonalPx = getMaximumSafeDiagonalPx(
        viewportWidth,
        viewportHeight,
        cellWidthPercent,
        cellHeightPercent,
        driftX,
        driftY,
      );
      const maximumRenderedDiagonalPx = Math.min(
        settings.maximumImageDiagonalPx,
        maximumSafeDiagonalPx,
      );
      const diagonalPx = Math.min(
        requestedDiagonalPx,
        maximumRenderedDiagonalPx,
      );
      const safeEdgeMargins = getSafeEdgeMargins(
        viewportWidth,
        viewportHeight,
        driftX,
        driftY,
        maximumRenderedDiagonalPx,
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
        diagonalPx,
        maximumSafeDiagonalPx: maximumRenderedDiagonalPx,
        diagonalScale: 1,
        driftX,
        driftY,
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
  const [settings, setSettings] = useState<SlideshowSettings>({
    minimumDisplayCount: DEFAULT_MIN_DISPLAY_COUNT,
    maximumDisplayCount: DEFAULT_MAX_DISPLAY_COUNT,
    minimumSwitchSeconds: DEFAULT_MIN_SWITCH_SECONDS,
    maximumSwitchSeconds: DEFAULT_MAX_SWITCH_SECONDS,
    minimumImageDiagonalPx: DEFAULT_MIN_IMAGE_DIAGONAL_PX,
    maximumImageDiagonalPx: DEFAULT_MAX_IMAGE_DIAGONAL_PX,
  });
  const [draftSettings, setDraftSettings] =
    useState<DraftSlideshowSettings>({
      minimumDisplayCount: String(DEFAULT_MIN_DISPLAY_COUNT),
      maximumDisplayCount: String(DEFAULT_MAX_DISPLAY_COUNT),
      minimumSwitchSeconds: String(DEFAULT_MIN_SWITCH_SECONDS),
      maximumSwitchSeconds: String(DEFAULT_MAX_SWITCH_SECONDS),
      minimumImageDiagonalPx: String(DEFAULT_MIN_IMAGE_DIAGONAL_PX),
      maximumImageDiagonalPx: String(DEFAULT_MAX_IMAGE_DIAGONAL_PX),
    });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const savedMaximumDisplayCount = Number.parseInt(
      window.localStorage.getItem(MAX_DISPLAY_COUNT_STORAGE_KEY) ?? "",
      10,
    );
    const initialMaximumDisplayCount = Number.isNaN(savedMaximumDisplayCount)
      ? DEFAULT_MAX_DISPLAY_COUNT
      : clamp(
          savedMaximumDisplayCount,
          MIN_CONFIGURABLE_DISPLAY_COUNT,
          MAX_CONFIGURABLE_DISPLAY_COUNT,
        );
    const savedMinimumDisplayCount = Number.parseInt(
      window.localStorage.getItem(MIN_DISPLAY_COUNT_STORAGE_KEY) ?? "",
      10,
    );
    const initialMinimumDisplayCount = Number.isNaN(savedMinimumDisplayCount)
      ? getLegacyMinimumDisplayCount(initialMaximumDisplayCount)
      : clamp(
          savedMinimumDisplayCount,
          MIN_CONFIGURABLE_DISPLAY_COUNT,
          initialMaximumDisplayCount,
        );
    const savedMinimumSwitchSeconds = Number.parseInt(
      window.localStorage.getItem(MIN_SWITCH_SECONDS_STORAGE_KEY) ?? "",
      10,
    );
    const savedMaximumSwitchSeconds = Number.parseInt(
      window.localStorage.getItem(MAX_SWITCH_SECONDS_STORAGE_KEY) ?? "",
      10,
    );
    const initialMaximumSwitchSeconds = Number.isNaN(
      savedMaximumSwitchSeconds,
    )
      ? DEFAULT_MAX_SWITCH_SECONDS
      : clamp(
          savedMaximumSwitchSeconds,
          MIN_CONFIGURABLE_SWITCH_SECONDS,
          MAX_CONFIGURABLE_SWITCH_SECONDS,
        );
    const initialMinimumSwitchSeconds = Number.isNaN(
      savedMinimumSwitchSeconds,
    )
      ? DEFAULT_MIN_SWITCH_SECONDS
      : clamp(
          savedMinimumSwitchSeconds,
          MIN_CONFIGURABLE_SWITCH_SECONDS,
          initialMaximumSwitchSeconds,
        );
    const savedMinimumImageDiagonalPx = Number.parseInt(
      window.localStorage.getItem(MIN_IMAGE_DIAGONAL_STORAGE_KEY) ??
        window.localStorage.getItem(LEGACY_MIN_IMAGE_LONG_SIDE_STORAGE_KEY) ??
        "",
      10,
    );
    const savedMaximumImageDiagonalPx = Number.parseInt(
      window.localStorage.getItem(MAX_IMAGE_DIAGONAL_STORAGE_KEY) ??
        window.localStorage.getItem(LEGACY_MAX_IMAGE_LONG_SIDE_STORAGE_KEY) ??
        "",
      10,
    );
    const initialMaximumImageDiagonalPx = Number.isNaN(
      savedMaximumImageDiagonalPx,
    )
      ? DEFAULT_MAX_IMAGE_DIAGONAL_PX
      : clamp(
          savedMaximumImageDiagonalPx,
          MIN_CONFIGURABLE_IMAGE_DIAGONAL_PX,
          MAX_CONFIGURABLE_IMAGE_DIAGONAL_PX,
        );
    const initialMinimumImageDiagonalPx = Number.isNaN(
      savedMinimumImageDiagonalPx,
    )
      ? DEFAULT_MIN_IMAGE_DIAGONAL_PX
      : clamp(
          savedMinimumImageDiagonalPx,
          MIN_CONFIGURABLE_IMAGE_DIAGONAL_PX,
          initialMaximumImageDiagonalPx,
        );
    const initialSettings = {
      minimumDisplayCount: initialMinimumDisplayCount,
      maximumDisplayCount: initialMaximumDisplayCount,
      minimumSwitchSeconds: initialMinimumSwitchSeconds,
      maximumSwitchSeconds: initialMaximumSwitchSeconds,
      minimumImageDiagonalPx: initialMinimumImageDiagonalPx,
      maximumImageDiagonalPx: initialMaximumImageDiagonalPx,
    } satisfies SlideshowSettings;

    void fetchImages(controller.signal).then((loadedImages) => {
      if (controller.signal.aborted) {
        return;
      }

      setSettings(initialSettings);
      setDraftSettings({
        minimumDisplayCount: String(initialSettings.minimumDisplayCount),
        maximumDisplayCount: String(initialSettings.maximumDisplayCount),
        minimumSwitchSeconds: String(initialSettings.minimumSwitchSeconds),
        maximumSwitchSeconds: String(initialSettings.maximumSwitchSeconds),
        minimumImageDiagonalPx: String(initialSettings.minimumImageDiagonalPx),
        maximumImageDiagonalPx: String(initialSettings.maximumImageDiagonalPx),
      });

      if (loadedImages) {
        setImages(loadedImages);
        setFloatingItems(
          createFloatingItems(
            loadedImages.length,
            window.innerWidth,
            window.innerHeight,
            initialSettings,
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
      timers[slotIndex] = window.setTimeout(
        () => {
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
              diagonalPx: Math.min(
                randomInteger(
                  settings.minimumImageDiagonalPx,
                  settings.maximumImageDiagonalPx,
                ),
                currentItem.maximumSafeDiagonalPx,
              ),
              diagonalScale: 1,
            };
            return nextItems;
          });
          scheduleChange(slotIndex);
        },
        randomInteger(
          settings.minimumSwitchSeconds * 1_000,
          settings.maximumSwitchSeconds * 1_000,
        ),
      );
    }

    for (let slotIndex = 0; slotIndex < floatingItems.length; slotIndex += 1) {
      scheduleChange(slotIndex);
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [
    images.length,
    floatingItems.length,
    settings.maximumImageDiagonalPx,
    settings.maximumSwitchSeconds,
    settings.minimumImageDiagonalPx,
    settings.minimumSwitchSeconds,
  ]);

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
            settings,
          ),
        );
      }, 200);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(resizeTimer);
    };
  }, [images.length, settings]);

  useEffect(() => {
    if (
      !areControlsVisible ||
      isSettingsOpen ||
      isUploading
    ) {
      return;
    }

    const hideTimer = window.setTimeout(() => {
      setAreControlsVisible(false);
    }, CONTROLS_VISIBLE_MS);

    return () => window.clearTimeout(hideTimer);
  }, [areControlsVisible, isSettingsOpen, isUploading]);

  function handleControlsToggle() {
    if (areControlsVisible) {
      setIsSettingsOpen(false);
    }

    setAreControlsVisible((areVisible) => !areVisible);
  }

  function handleDisplaySettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const enteredMinimumDisplayCount = Number.parseInt(
      draftSettings.minimumDisplayCount,
      10,
    );
    const enteredMaximumDisplayCount = Number.parseInt(
      draftSettings.maximumDisplayCount,
      10,
    );
    const nextMaximumDisplayCount = Number.isNaN(enteredMaximumDisplayCount)
      ? settings.maximumDisplayCount
      : clamp(
          enteredMaximumDisplayCount,
          MIN_CONFIGURABLE_DISPLAY_COUNT,
          MAX_CONFIGURABLE_DISPLAY_COUNT,
        );
    const nextMinimumDisplayCount = Number.isNaN(enteredMinimumDisplayCount)
      ? settings.minimumDisplayCount
      : clamp(
          enteredMinimumDisplayCount,
          MIN_CONFIGURABLE_DISPLAY_COUNT,
          nextMaximumDisplayCount,
        );
    const enteredMinimumSwitchSeconds = Number.parseInt(
      draftSettings.minimumSwitchSeconds,
      10,
    );
    const enteredMaximumSwitchSeconds = Number.parseInt(
      draftSettings.maximumSwitchSeconds,
      10,
    );
    const nextMaximumSwitchSeconds = Number.isNaN(enteredMaximumSwitchSeconds)
      ? settings.maximumSwitchSeconds
      : clamp(
          enteredMaximumSwitchSeconds,
          MIN_CONFIGURABLE_SWITCH_SECONDS,
          MAX_CONFIGURABLE_SWITCH_SECONDS,
        );
    const nextMinimumSwitchSeconds = Number.isNaN(enteredMinimumSwitchSeconds)
      ? settings.minimumSwitchSeconds
      : clamp(
          enteredMinimumSwitchSeconds,
          MIN_CONFIGURABLE_SWITCH_SECONDS,
          nextMaximumSwitchSeconds,
        );
    const enteredMinimumImageDiagonalPx = Number.parseInt(
      draftSettings.minimumImageDiagonalPx,
      10,
    );
    const enteredMaximumImageDiagonalPx = Number.parseInt(
      draftSettings.maximumImageDiagonalPx,
      10,
    );
    const nextMaximumImageDiagonalPx = Number.isNaN(
      enteredMaximumImageDiagonalPx,
    )
      ? settings.maximumImageDiagonalPx
      : clamp(
          enteredMaximumImageDiagonalPx,
          MIN_CONFIGURABLE_IMAGE_DIAGONAL_PX,
          MAX_CONFIGURABLE_IMAGE_DIAGONAL_PX,
        );
    const nextMinimumImageDiagonalPx = Number.isNaN(
      enteredMinimumImageDiagonalPx,
    )
      ? settings.minimumImageDiagonalPx
      : clamp(
          enteredMinimumImageDiagonalPx,
          MIN_CONFIGURABLE_IMAGE_DIAGONAL_PX,
          nextMaximumImageDiagonalPx,
        );
    const nextSettings = {
      minimumDisplayCount: nextMinimumDisplayCount,
      maximumDisplayCount: nextMaximumDisplayCount,
      minimumSwitchSeconds: nextMinimumSwitchSeconds,
      maximumSwitchSeconds: nextMaximumSwitchSeconds,
      minimumImageDiagonalPx: nextMinimumImageDiagonalPx,
      maximumImageDiagonalPx: nextMaximumImageDiagonalPx,
    } satisfies SlideshowSettings;

    window.localStorage.setItem(
      MIN_DISPLAY_COUNT_STORAGE_KEY,
      String(nextSettings.minimumDisplayCount),
    );
    window.localStorage.setItem(
      MAX_DISPLAY_COUNT_STORAGE_KEY,
      String(nextSettings.maximumDisplayCount),
    );
    window.localStorage.setItem(
      MIN_SWITCH_SECONDS_STORAGE_KEY,
      String(nextSettings.minimumSwitchSeconds),
    );
    window.localStorage.setItem(
      MAX_SWITCH_SECONDS_STORAGE_KEY,
      String(nextSettings.maximumSwitchSeconds),
    );
    window.localStorage.setItem(
      MIN_IMAGE_DIAGONAL_STORAGE_KEY,
      String(nextSettings.minimumImageDiagonalPx),
    );
    window.localStorage.setItem(
      MAX_IMAGE_DIAGONAL_STORAGE_KEY,
      String(nextSettings.maximumImageDiagonalPx),
    );
    setSettings(nextSettings);
    setDraftSettings({
      minimumDisplayCount: String(nextSettings.minimumDisplayCount),
      maximumDisplayCount: String(nextSettings.maximumDisplayCount),
      minimumSwitchSeconds: String(nextSettings.minimumSwitchSeconds),
      maximumSwitchSeconds: String(nextSettings.maximumSwitchSeconds),
      minimumImageDiagonalPx: String(nextSettings.minimumImageDiagonalPx),
      maximumImageDiagonalPx: String(nextSettings.maximumImageDiagonalPx),
    });
    setFloatingItems(
      createFloatingItems(
        images.length,
        window.innerWidth,
        window.innerHeight,
        nextSettings,
      ),
    );
    setIsSettingsOpen(false);
  }

  function handleImageLoad(
    itemId: string,
    event: SyntheticEvent<HTMLImageElement>,
  ) {
    const { naturalWidth, naturalHeight } = event.currentTarget;

    if (naturalWidth === 0 || naturalHeight === 0) {
      return;
    }

    const diagonalScale =
      Math.max(naturalWidth, naturalHeight) /
      Math.hypot(naturalWidth, naturalHeight);

    setFloatingItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId &&
        Math.abs(item.diagonalScale - diagonalScale) > 0.0001
          ? { ...item, diagonalScale }
          : item,
      ),
    );
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
          settings,
        );
        const uploadedIndex = refreshedImages.findIndex(
          (image) => image.key === lastUploadedKey,
        );

        if (uploadedIndex >= 0 && nextItems[0]) {
          nextItems[0] = {
            ...nextItems[0],
            imageIndex: uploadedIndex,
            diagonalScale: 1,
          };
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
              "--image-size": `${item.diagonalPx}px`,
              "--image-diagonal-scale": item.diagonalScale,
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
                    onLoad={(event) => handleImageLoad(item.id, event)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <h1 className="slideshow-title">vision</h1>
      )}

      <button
        className="controls-trigger"
        type="button"
        aria-label={
          areControlsVisible
            ? "操作項目を隠す"
            : "操作項目を表示する"
        }
        aria-expanded={areControlsVisible}
        onClick={handleControlsToggle}
      />

      <input
        ref={fileInputRef}
        className="upload-input"
        type="file"
        accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
        multiple
        onChange={handleUpload}
      />
      <button
        className={`upload-button controls-hideable ${
          areControlsVisible ? "controls-visible" : ""
        }`}
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? "追加中…" : "画像を追加"}
      </button>

      {uploadMessage && (
        <p
          className={`upload-message controls-hideable ${
            areControlsVisible ? "controls-visible" : ""
          }`}
          role="status"
        >
          {uploadMessage}
        </p>
      )}

      <button
        className={`settings-button controls-hideable ${
          areControlsVisible ? "controls-visible" : ""
        }`}
        type="button"
        aria-controls="display-settings"
        aria-expanded={isSettingsOpen}
        onClick={() => setIsSettingsOpen((isOpen) => !isOpen)}
      >
        表示 {settings.minimumDisplayCount}〜{settings.maximumDisplayCount}枚
        ・切替 {settings.minimumSwitchSeconds}〜
        {settings.maximumSwitchSeconds}秒・対角線
        {settings.minimumImageDiagonalPx}〜{settings.maximumImageDiagonalPx}px
      </button>

      {isSettingsOpen && (
        <form
          id="display-settings"
          className={`settings-panel controls-hideable ${
            areControlsVisible ? "controls-visible" : ""
          }`}
          onSubmit={handleDisplaySettings}
        >
          <fieldset className="settings-group">
            <legend>表示枚数</legend>
            <div className="settings-range">
              <label className="settings-label" htmlFor="minimum-display-count">
                最小
                <input
                  id="minimum-display-count"
                  className="settings-input"
                  type="number"
                  min={MIN_CONFIGURABLE_DISPLAY_COUNT}
                  max={MAX_CONFIGURABLE_DISPLAY_COUNT}
                  step="1"
                  required
                  value={draftSettings.minimumDisplayCount}
                  onChange={(event) =>
                    setDraftSettings((currentSettings) => ({
                      ...currentSettings,
                      minimumDisplayCount: event.target.value,
                    }))
                  }
                />
              </label>
              <span className="settings-separator">〜</span>
              <label className="settings-label" htmlFor="maximum-display-count">
                最大
                <input
                  id="maximum-display-count"
                  className="settings-input"
                  type="number"
                  min={MIN_CONFIGURABLE_DISPLAY_COUNT}
                  max={MAX_CONFIGURABLE_DISPLAY_COUNT}
                  step="1"
                  required
                  value={draftSettings.maximumDisplayCount}
                  onChange={(event) =>
                    setDraftSettings((currentSettings) => ({
                      ...currentSettings,
                      maximumDisplayCount: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="settings-group">
            <legend>切替秒数</legend>
            <div className="settings-range">
              <label className="settings-label" htmlFor="minimum-switch-seconds">
                最小
                <input
                  id="minimum-switch-seconds"
                  className="settings-input"
                  type="number"
                  min={MIN_CONFIGURABLE_SWITCH_SECONDS}
                  max={MAX_CONFIGURABLE_SWITCH_SECONDS}
                  step="1"
                  required
                  value={draftSettings.minimumSwitchSeconds}
                  onChange={(event) =>
                    setDraftSettings((currentSettings) => ({
                      ...currentSettings,
                      minimumSwitchSeconds: event.target.value,
                    }))
                  }
                />
              </label>
              <span className="settings-separator">〜</span>
              <label className="settings-label" htmlFor="maximum-switch-seconds">
                最大
                <input
                  id="maximum-switch-seconds"
                  className="settings-input"
                  type="number"
                  min={MIN_CONFIGURABLE_SWITCH_SECONDS}
                  max={MAX_CONFIGURABLE_SWITCH_SECONDS}
                  step="1"
                  required
                  value={draftSettings.maximumSwitchSeconds}
                  onChange={(event) =>
                    setDraftSettings((currentSettings) => ({
                      ...currentSettings,
                      maximumSwitchSeconds: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="settings-group">
            <legend>画像の対角線（px）</legend>
            <div className="settings-range">
              <label className="settings-label" htmlFor="minimum-image-size">
                最小
                <input
                  id="minimum-image-size"
                  className="settings-input"
                  type="number"
                  min={MIN_CONFIGURABLE_IMAGE_DIAGONAL_PX}
                  max={MAX_CONFIGURABLE_IMAGE_DIAGONAL_PX}
                  step="1"
                  required
                  value={draftSettings.minimumImageDiagonalPx}
                  onChange={(event) =>
                    setDraftSettings((currentSettings) => ({
                      ...currentSettings,
                      minimumImageDiagonalPx: event.target.value,
                    }))
                  }
                />
              </label>
              <span className="settings-separator">〜</span>
              <label className="settings-label" htmlFor="maximum-image-size">
                最大
                <input
                  id="maximum-image-size"
                  className="settings-input"
                  type="number"
                  min={MIN_CONFIGURABLE_IMAGE_DIAGONAL_PX}
                  max={MAX_CONFIGURABLE_IMAGE_DIAGONAL_PX}
                  step="1"
                  required
                  value={draftSettings.maximumImageDiagonalPx}
                  onChange={(event) =>
                    setDraftSettings((currentSettings) => ({
                      ...currentSettings,
                      maximumImageDiagonalPx: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </fieldset>

          <p className="settings-description">
            サイズは画像の左下から右上までの距離です。画面に収まらない
            場合だけ自動的に縮小します。
          </p>
          <button className="settings-submit" type="submit">
            反映する
          </button>
        </form>
      )}

      <Link
        className={`updates-link controls-hideable ${
          areControlsVisible ? "controls-visible" : ""
        }`}
        href="/updates"
      >
        更新情報
      </Link>
    </main>
  );
}
