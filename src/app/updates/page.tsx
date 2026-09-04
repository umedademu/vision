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
        <h1 className="updates-title">v0.024</h1>

        <section className="updates-entry">
          <h2>v0.024</h2>
          <ul>
            <li>表示枚数が多い場合も指定した画像サイズを維持するよう変更</li>
            <li>配置しきれない場合は画像サイズではなく重なりを許容</li>
            <li>画面外へのはみ出しを防ぐための縮小処理は維持</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.023</h2>
          <ul>
            <li>保存済み画像を一覧表示する画像管理ページを追加</li>
            <li>選択した画像を確認後に削除できる機能を追加</li>
            <li>トップページに画像管理ページへのリンクを追加</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.022</h2>
          <ul>
            <li>画像同士の重なり許容値を0〜100%で設定可能に変更</li>
            <li>初回表示と途中で増える画像の配置に設定値を反映</li>
            <li>表示設定内の説明文を削除</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.021</h2>
          <ul>
            <li>交差表示にかける時間の最小値と最大値を設定可能に変更</li>
            <li>0.1〜10秒の範囲で小数入力に対応</li>
            <li>画像を入れ替える間隔と切替時間の表示を分かりやすく整理</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.020</h2>
          <ul>
            <li>画像の切り替えを1.0〜1.5秒の柔らかな交差表示へ変更</li>
            <li>古い画像が徐々に消えながら新しい画像が現れるよう調整</li>
            <li>表示枚数が増減する場合も徐々に現れる・消える動きへ変更</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.019</h2>
          <ul>
            <li>表示枚数の増減時に全画像を並べ直す動きを廃止</li>
            <li>枚数が増える場合は空いている場所へ1枚だけ追加</li>
            <li>枚数が減る場合は既存画像の位置を変えずに1枚だけ削除</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.018</h2>
          <ul>
            <li>画像が切り替わるたびに表示枚数も1枚ずつ増減するよう変更</li>
            <li>設定した最小枚数と最大枚数の範囲内で表示枚数を変動</li>
            <li>枚数変更時の画像の移動を滑らかに調整</li>
          </ul>
        </section>

        <section className="updates-entry">
          <h2>v0.017</h2>
          <ul>
            <li>画像サイズの基準を長辺から対角線の長さへ変更</li>
            <li>縦横比が異なる画像同士の見た目の大きさの差を軽減</li>
            <li>従来の画像サイズ設定値を対角線設定として引き継ぐ処理を追加</li>
          </ul>
        </section>

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
