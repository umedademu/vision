import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "更新情報 | vision",
};

export default function UpdatesPage() {
  return (
    <main className="updates-page">
      <div className="updates-content">
        <p className="updates-label">現在のバージョン</p>
        <h1 className="updates-title">v0.002</h1>

        <section className="updates-entry">
          <h2>v0.002</h2>
          <ul>
            <li>トップページに更新情報ページへのリンクを追加</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.001</h2>
          <ul>
            <li>Cloudflare R2に保存した画像の読み込みに対応</li>
            <li>画像を5秒ごとにランダム表示する機能を追加</li>
            <li>更新情報ページを追加</li>
          </ul>
        </section>

        <Link className="updates-back" href="/">
          トップページへ戻る
        </Link>
      </div>
    </main>
  );
}
