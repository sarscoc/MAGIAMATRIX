# Magia Matrix — Notion接続 完成セット

## 入っているもの

- `index.html` — 公開するマギアマトリクス本体
- `worker.js` — Notion APIを読み取るためのCloudflare Worker
- `wrangler.toml` — Workerの設定
- `package.json` — Workerをコマンドで公開する場合の設定

## 重要：なぜHTMLだけではない？

Notion APIをブラウザから直接読む構成はCORSやAPIキーの扱いに問題があるため、
`index.html → Cloudflare Worker → Notion API`
という構成にしています。

WorkerはAPIキーを保存しません。ブラウザから受け取ったキーを、その1回のNotion読み取りにだけ使います。


## APIキーの取得方法について

APIキーの発行・取得・権限設定の方法は、各サービスの公式案内を確認してご自身で設定してください。このページではAPIキーの作り方・取得方法は案内しません。

## Notion側で準備するもの

1. NotionでIntegration（接続）を作る。
2. 可能なら読み取り権限だけにする。
3. 読み込みたい元データベースを、そのIntegrationに共有する。
4. IntegrationのAPIキーを控える。
5. データベースURLを控える。

※ linked databaseではなく、元のデータソースをIntegrationに共有してください。

## Cloudflare Workerを公開する

### 方法A：Cloudflare Dashboardで作る

1. Cloudflareにログイン。
2. Workers & Pages → Workerを作成。
3. `worker.js` の中身を貼る。
4. デプロイ。
5. 発行された `https://....workers.dev` のURLを控える。
6. 公開サイトが完成したら `ALLOWED_ORIGIN` をそのサイトのOriginに制限する。

### 方法B：コマンド

このフォルダで:

```bash
npm install
npx wrangler login
npm run deploy
```

`wrangler.toml` の `ALLOWED_ORIGIN` は、最初は `*` でテストできます。
本公開では例として:

```toml
ALLOWED_ORIGIN = "https://YOURNAME.github.io"
```

のように変更してください。

## index.htmlを公開する

GitHub Pages等に `index.html` を置きます。

画面に次を入力します。

- 中継Worker URL
- Notion APIキー
- Notion データベースURLまたはID
- 名前プロパティ名
- 画像プロパティ名
- URLプロパティ名
- 文字色プロパティ名（任意）

そして「Notionを読み込む」。

## 保存される場所

### Local Storage
- Worker URL
- NotionデータベースURL/ID
- プロパティ名
- コメント
- アイコン配置
- 切り抜き位置
- 個別色
- APIキー（「この端末に保存する」をONにした場合のみ）

Chrome:
`開発者ツール → Application → Local Storage → このサイトのURL`

### IndexedDB
- 左側テンプレ画像
- 右側テンプレ画像

Chrome:
`開発者ツール → Application → IndexedDB → magiaMatrixDB`

## Notionへ書き込まない仕組み

このWorkerがNotionへ呼ぶのは以下だけです。

- `GET /v1/data_sources/{id}`
- `GET /v1/databases/{id}`
- `POST /v1/data_sources/{id}/query`

最後はHTTP上はPOSTですが、Notionの「データソースを検索して読む」APIです。
ページ作成、ページ更新、データベース更新、削除APIはコードに実装していません。

## 画像について

Notionが返すファイルURLは期限付きの場合があります。
このアプリはNotionを読み込むたびに最新URLを取り直すため、保存した古いURLに依存しません。

画像プロパティが空の場合は:
1. Notionページのアイコン
2. URLプロパティのサイト `/favicon.ico`

の順に使います。

## APIキーの注意

APIキーが漏れた場合、そのIntegrationに与えられた権限の範囲で第三者に悪用される可能性があります。
そのため:

- 可能なら読み取り専用Integrationを使う
- 共有端末ではAPIキー保存をOFF
- Workerの `ALLOWED_ORIGIN` を本番サイトに限定
- 漏れた疑いがある場合はNotion側でキーを無効化・再発行

を推奨します。
