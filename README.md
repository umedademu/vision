# vision

Cloudflare R2に保存した画像を、スクリーンセーバーのように5秒ごとにランダム表示するWebアプリ。

現在のバージョン: `v0.003`

Vercelへのデプロイを前提とした、Next.js App Router + TypeScript構成のプロジェクトです。

## 開発

```bash
npm install
Copy-Item .env.example .env.local
```

`.env.local` にCloudflare R2の接続情報と、画像追加用の合言葉を設定してから起動します。

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
    slideshow.tsx                 5秒ごとのランダム表示
    updates/page.tsx              更新情報ページ
```

R2バケットが未設定または空の場合は、画面中央に `vision` と表示します。

トップページ左下の「画像を追加」から、対応画像を1枚25MBまで、複数まとめてR2へ保存できます。最初の追加時に `.env.local` の `UPLOAD_PASSWORD` に設定した合言葉を入力します。

トップページ右下の「更新情報」リンク、または `/updates` で更新履歴を確認できます。
