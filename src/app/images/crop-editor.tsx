"use client";

import { useEffect, useRef, useState } from "react";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { isImageCrop, toImageCrop, type ImageItem } from "@/lib/image-crop";
import { StoredImage } from "../stored-image";

const FULL_CROP: PercentCrop = { unit: "%", x: 0, y: 0, width: 100, height: 100 };
const CROP_LABELS = {
  cropArea: "切り抜き範囲",
  nwDragHandle: "左上の角を調整",
  nDragHandle: "上辺を調整",
  neDragHandle: "右上の角を調整",
  eDragHandle: "右辺を調整",
  seDragHandle: "右下の角を調整",
  sDragHandle: "下辺を調整",
  swDragHandle: "左下の角を調整",
  wDragHandle: "左辺を調整",
};

export function CropEditor({ image, onSave, onClose }: {
  image: ImageItem;
  onSave: (image: ImageItem) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const savingRef = useRef(false);
  const [crop, setCrop] = useState<PercentCrop>(() => image.crop ? {
    unit: "%",
    x: image.crop.x / image.crop.sourceWidth * 100,
    y: image.crop.y / image.crop.sourceHeight * 100,
    width: image.crop.width / image.crop.sourceWidth * 100,
    height: image.crop.height / image.crop.sourceHeight * 100,
  } : FULL_CROP);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current!;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = oldOverflow;
    };
  }, []);

  const selectedCrop = dimensions && crop.width > 0 && crop.height > 0
    ? toImageCrop(crop, dimensions.width, dimensions.height)
    : undefined;

  async function saveCrop() {
    if (!selectedCrop || loadFailed || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/images/crop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: image.key, crop: selectedCrop }),
      });
      const data = await response.json();
      if (!response.ok || !isImageCrop(data.crop)) {
        throw new Error(data.error ?? "切り抜きを保存できませんでした。");
      }
      onSave({ ...image, crop: data.crop });
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存できませんでした。もう一度お試しください。");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="crop-dialog"
      aria-labelledby="crop-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!savingRef.current) onClose();
      }}
    >
      <h2 id="crop-title">切り抜き</h2>
      <div className="crop-workspace">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          keepSelection
          minWidth={1}
          minHeight={1}
          disabled={isSaving || !dimensions || loadFailed}
          ariaLabels={CROP_LABELS}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="crop-source"
            src={image.url}
            alt="切り抜く元画像"
            draggable={false}
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              if (naturalWidth > 0 && naturalHeight > 0) {
                setDimensions({ width: naturalWidth, height: naturalHeight });
              }
            }}
            onError={() => {
              setLoadFailed(true);
              setError("画像を読み込めませんでした。画像一覧を開き直してください。");
            }}
          />
        </ReactCrop>
      </div>
      {selectedCrop && !loadFailed && (
        <div className="crop-result">
          <StoredImage className="crop-preview" image={{ ...image, crop: selectedCrop }} alt="切り抜き後の画像" />
          <p>{selectedCrop.width} × {selectedCrop.height}px</p>
        </div>
      )}
      {error && <p className="crop-error" role="alert">{error}</p>}
      <div className="crop-actions">
        <button type="button" disabled={isSaving || !dimensions} onClick={() => setCrop(FULL_CROP)}>全体を選択</button>
        <button type="button" disabled={isSaving} onClick={onClose}>やめる</button>
        <button className="crop-save" type="button" disabled={isSaving || !selectedCrop || loadFailed} onClick={() => void saveCrop()}>
          {isSaving ? "保存中…" : "保存する"}
        </button>
      </div>
    </dialog>
  );
}
