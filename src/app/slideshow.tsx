"use client";

import { useEffect, useState } from "react";

type ImageItem = {
  key: string;
  url: string;
};

type ImagesResponse = {
  images: ImageItem[];
};

const DISPLAY_INTERVAL_MS = 5_000;

function chooseNextIndex(currentIndex: number, imageCount: number) {
  if (imageCount < 2) {
    return currentIndex;
  }

  const offset = Math.floor(Math.random() * (imageCount - 1)) + 1;
  return (currentIndex + offset) % imageCount;
}

export function Slideshow() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadImages() {
      try {
        const response = await fetch("/api/images", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as ImagesResponse;
        setImages(data.images);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("画像の読み込みに失敗しました。", error);
        }
      }
    }

    void loadImages();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (images.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((current) => chooseNextIndex(current, images.length));
    }, DISPLAY_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [images.length]);

  const currentImage = images[currentIndex];

  return (
    <main className="slideshow">
      {currentImage ? (
        // R2の署名付きURLをブラウザから直接読み込みます。
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={currentImage.key}
          className="slideshow-image"
          src={currentImage.url}
          alt=""
        />
      ) : (
        <h1 className="slideshow-title">vision</h1>
      )}
    </main>
  );
}
