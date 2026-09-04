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
        <h1 className="updates-title">v0.016</h1>

        <section className="updates-entry">
          <h2>v0.016</h2>
          <ul>
            <li>縦長画像の高さが設定値を超える表示不具合を修正</li>
            <li>画像の向きにかかわらず長辺が設定範囲内に収まるよう修正</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.015</h2>
          <ul>
            <li>PC画面でも画像以外の操作項目を通常時は非表示に変更</li>
            <li>全画面で画面上部の操作による一時表示に統一</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.014</h2>
          <ul>
            <li>スマホ横向き画面でも操作項目を通常時は非表示に変更</li>
            <li>横向き画面の上部タップによる一時表示に対応</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.013</h2>
          <ul>
            <li>スマホ画面では画像以外の操作項目を通常時は非表示に変更</li>
            <li>画面上部のタップで操作項目を一時表示する機能を追加</li>
            <li>設定中と画像追加中は操作項目の表示を維持</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.012</h2>
          <ul>
            <li>画像の長辺をピクセル単位で最小〜最大設定できる機能を追加</li>
            <li>縦長・横長の画像ともに縦横比を維持</li>
            <li>画面や表示枚数に対して大きすぎる場合の自動縮小に対応</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.011</h2>
          <ul>
            <li>表示枚数の最小値と最大値を個別に設定可能に変更</li>
            <li>画像の切替秒数の最小値と最大値を設定する機能を追加</li>
            <li>表示枚数と切替秒数の設定をブラウザに保存</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.010</h2>
          <ul>
            <li>最大表示枚数を100枚まで設定可能に変更</li>
            <li>表示枚数に応じて配置領域を自動的に細分化</li>
            <li>画像サイズと浮遊幅を表示枚数に応じて自動調整</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.009</h2>
          <ul>
            <li>画像が画面の上下左右からはみ出さないよう調整</li>
            <li>画面サイズの変更時に安全な配置を再計算</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.008</h2>
          <ul>
            <li>常時表示する最大枚数の設定機能を追加</li>
            <li>最小枚数を設定値から30%減らした枚数へ自動設定</li>
            <li>設定した最大枚数をブラウザに保存</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.007</h2>
          <ul>
            <li>画像同士が大きく重ならないよう配置を分散</li>
            <li>浮遊時の重なりが3割程度までになるよう移動範囲を調整</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.006</h2>
          <ul>
            <li>同時表示する画像数を8〜12枚から毎回ランダムに決定</li>
            <li>画像全体が見える、宙を漂うような表示へ変更</li>
            <li>各画像の大きさを80〜100%の範囲でランダム化</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.005</h2>
          <ul>
            <li>画面サイズに応じて8〜12枚の画像を同時表示</li>
            <li>各画像が別々に5〜10秒ごとに切り替わる表示へ変更</li>
            <li>同じ画像が同時に重なりにくいよう調整</li>
          </ul>
        </section>

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
