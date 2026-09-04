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
        <h1 className="updates-title">v0.004</h1>

        <section className="updates-entry">
          <h2>v0.004</h2>
          <ul>
            <li>画像を追加するときの合言葉入力を廃止</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.003</h2>
          <ul>
            <li>トップページから画像を追加できる機能を追加</li>
            <li>複数画像の一括追加と、1枚25MBまでの画像に対応</li>
            <li>合言葉を使って第三者からの追加を防ぐ仕組みを追加</li>
          </ul>
        </section>

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
