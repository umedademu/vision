"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ImageItem = {
  key: string;
  url: string;
};

type ImagesResponse = {
  images?: ImageItem[];
};

type DeleteResponse = {
  error?: string;
};

function getImageName(key: string) {
  return key.split("/").at(-1) ?? key;
}

export function ImageManager() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/images", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("画像一覧を読み込めませんでした。");
        }

        const data = (await response.json()) as ImagesResponse;
        setImages(data.images ?? []);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setMessage(
            error instanceof Error
              ? error.message
              : "画像一覧を読み込めませんでした。",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  function toggleImage(key: string) {
    setSelectedKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);

      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }

      return nextKeys;
    });
    setIsConfirming(false);
    setMessage("");
  }

  function toggleAllImages() {
    setSelectedKeys((currentKeys) =>
      currentKeys.size === images.length
        ? new Set()
        : new Set(images.map((image) => image.key)),
    );
    setIsConfirming(false);
    setMessage("");
  }

  async function deleteSelectedImages() {
    const keys = Array.from(selectedKeys);

    if (keys.length === 0) {
      return;
    }

    setIsDeleting(true);
    setMessage("");
    const deletedKeys: string[] = [];
    const failedMessages: string[] = [];

    for (const key of keys) {
      try {
        const response = await fetch("/api/images", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
        const data = (await response.json()) as DeleteResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "画像を削除できませんでした。");
        }

        deletedKeys.push(key);
      } catch (error) {
        failedMessages.push(
          error instanceof Error ? error.message : "画像を削除できませんでした。",
        );
      }
    }

    const deletedKeySet = new Set(deletedKeys);
    setImages((currentImages) =>
      currentImages.filter((image) => !deletedKeySet.has(image.key)),
    );
    setSelectedKeys((currentKeys) =>
      new Set(Array.from(currentKeys).filter((key) => !deletedKeySet.has(key))),
    );
    setIsConfirming(false);
    setIsDeleting(false);

    if (failedMessages.length > 0) {
      setMessage(
        `${deletedKeys.length}枚を削除しました。${failedMessages.length}枚は削除できませんでした。`,
      );
    } else {
      setMessage(`${deletedKeys.length}枚の画像を削除しました。`);
    }
  }

  return (
    <main className="images-page">
      <div className="images-content">
        <p className="images-label">保存済み画像</p>
        <h1 className="images-title">画像管理</h1>

        <div className="images-actions">
          <p>{images.length}枚</p>
          {images.length > 0 && (
            <button type="button" onClick={toggleAllImages}>
              {selectedKeys.size === images.length ? "選択を解除" : "すべて選択"}
            </button>
          )}
          <button
            className="images-delete-button"
            type="button"
            disabled={selectedKeys.size === 0 || isDeleting}
            onClick={() => setIsConfirming(true)}
          >
            選択した画像を削除（{selectedKeys.size}）
          </button>
        </div>

        {isConfirming && (
          <div className="images-confirmation" role="alert">
            <p>選択した{selectedKeys.size}枚を削除しますか？</p>
            <div>
              <button
                className="images-delete-confirm"
                type="button"
                disabled={isDeleting}
                onClick={() => void deleteSelectedImages()}
              >
                {isDeleting ? "削除中…" : "削除する"}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsConfirming(false)}
              >
                やめる
              </button>
            </div>
          </div>
        )}

        {message && (
          <p className="images-message" role="status">
            {message}
          </p>
        )}

        {isLoading ? (
          <p className="images-empty">読み込み中…</p>
        ) : images.length === 0 ? (
          <p className="images-empty">保存されている画像はありません。</p>
        ) : (
          <div className="images-grid">
            {images.map((image) => (
              <label
                className={`images-card ${
                  selectedKeys.has(image.key) ? "images-card-selected" : ""
                }`}
                key={image.key}
              >
                <input
                  type="checkbox"
                  checked={selectedKeys.has(image.key)}
                  onChange={() => toggleImage(image.key)}
                />
                {/* R2の署名付きURLをブラウザから直接読み込みます。 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={getImageName(image.key)} loading="lazy" />
                <span>{getImageName(image.key)}</span>
              </label>
            ))}
          </div>
        )}

        <nav className="images-navigation" aria-label="関連ページ">
          <Link href="/">トップページへ戻る</Link>
          <Link href="/updates">更新情報</Link>
        </nav>
      </div>
    </main>
  );
}
