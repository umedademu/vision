import type { Metadata } from "next";
import { ImageManager } from "./image-manager";

export const metadata: Metadata = {
  title: "画像管理 | vision",
};

export default function ImagesPage() {
  return <ImageManager />;
}
