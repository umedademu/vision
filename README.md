# vision

Cloudflare R2に保存した画像を、スクリーンセーバーのように5秒ごとにランダム表示するWebアプリ。

現在のバージョン: `v0.002`

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
    globals.css                   全体のスタイル
    layout.tsx                    共通レイアウト
    page.tsx                      トップページ
    slideshow.tsx                 5秒ごとのランダム表示
    updates/page.tsx              更新情報ページ
```

R2バケットが未設定または空の場合は、画面中央に `vision` と表示します。

トップページ右下の「更新情報」リンク、または `/updates` で更新履歴を確認できます。
