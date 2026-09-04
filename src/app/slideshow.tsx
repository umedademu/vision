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

const DISPLAY_INTERVAL_MS = 5_000;

function chooseNextIndex(currentIndex: number, imageCount: number) {
  if (imageCount < 2) {
    return currentIndex;
  }

  const offset = Math.floor(Math.random() * (imageCount - 1)) + 1;
  return (currentIndex + offset) % imageCount;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchImages(controller.signal).then((loadedImages) => {
      if (loadedImages) {
        setImages(loadedImages);
      }
    });

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

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const savedPassword = window.sessionStorage.getItem(
      "vision-upload-password",
    );
    const uploadPassword =
      savedPassword ?? window.prompt("画像追加用の合言葉を入力してください。");

    if (!uploadPassword) {
      return;
    }

    window.sessionStorage.setItem("vision-upload-password", uploadPassword);
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
            "x-upload-password": uploadPassword,
          },
          body: JSON.stringify({ contentType: file.type, size: file.size }),
        });
        const prepared = (await prepareResponse.json()) as UploadUrlResponse;

        if (!prepareResponse.ok || !prepared.uploadUrl || !prepared.key) {
          if (prepareResponse.status === 401) {
            window.sessionStorage.removeItem("vision-upload-password");
          }

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
      const uploadedIndex =
        refreshedImages?.findIndex((image) => image.key === lastUploadedKey) ?? -1;

      if (refreshedImages) {
        setImages(refreshedImages);
        setCurrentIndex(uploadedIndex >= 0 ? uploadedIndex : 0);
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
