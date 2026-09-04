# vision

Cloudflare R2に保存した画像を、スクリーンセーバーのように同時に8〜12枚ずつランダム表示するWebアプリ。

現在のバージョン: `v0.005`

Vercelへのデプロイを前提とした、Next.js App Router + TypeScript構成のプロジェクトです。

## 開発

```bash
npm install
Copy-Item .env.example .env.local
```

`.env.local` にCloudflare R2の接続情報を設定してから起動します。

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## ディレクトリ構成

```text
src/
  app/
    api/images/route.ts            R2の画像一覧と一時URLを返すAPI
    api/uploads/route.ts           画像保存用の一時URLを発行するAPI
    globals.css                   全体のスタイル
    layout.tsx                    共通レイアウト
    page.tsx                      トップページ
    slideshow.tsx                 複数画像のランダム表示
    updates/page.tsx              更新情報ページ
```

R2バケットが未設定または空の場合は、画面中央に `vision` と表示します。

保存済み画像は画面サイズに応じて8〜12枚を同時に表示し、1枚ずつ別々のタイミングで5〜10秒ごとに切り替わります。

トップページ左下の「画像を追加」から、対応画像を1枚25MBまで、複数まとめてR2へ保存できます。

トップページ右下の「更新情報」リンク、または `/updates` で更新履歴を確認できます。
