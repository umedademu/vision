# vision

画像をスクリーンセーバーのように表示するWebアプリ。

Vercelへのデプロイを前提とした、Next.js App Router + TypeScript構成のプロジェクトです。

## 開発

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## ディレクトリ構成

```text
public/
  images/                         表示する画像などの静的ファイル
src/
  app/                            ルーティングとアプリ全体の設定
  features/
    screensaver/                  スクリーンセーバー機能
      components/                 機能固有のUIコンポーネント
```
