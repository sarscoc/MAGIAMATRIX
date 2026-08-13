# Magia Matrix

## ファイル
- index.html : 公開ページ
- worker.js : Notion読み取り用Cloudflare Worker
- wrangler.toml : Worker設定
- package.json : Wrangler用

## 画面
- 上部: Notion接続
- 左: Notionから読み込んだアイコン一覧
- 右: テンプレ画像 + 配置領域
- 右端: アイコンサイズ / コメント / 名前 / 文字色 / フォント設定

左のアイコンを右のテンプレ画像上へドラッグして配置できます。

## APIキーについて
APIキーの発行・取得・権限設定の方法は、各サービスの公式案内を確認してご自身で設定してください。
このページではAPIキーの作り方・取得方法は案内しません。

## テンプレ
右側の大きな領域に画像をドラッグ＆ドロップしてください。
テンプレ画像は IndexedDB に保存されます。

## 保存先
Local Storage:
- 接続設定
- APIキー（保存をONにした場合のみ）
- アイコン配置
- コメント
- 切り抜き
- 表示設定

IndexedDB:
- テンプレ画像

Chromeでは:
開発者ツール → Application → Local Storage / IndexedDB

## Notion
Workerは読み取りに必要なAPIだけを使用します。
作成・更新・削除APIは実装していません。


## Worker URLを利用者に入力させない設定

`index.html` の先頭付近にある次の1行だけ、公開者が一度設定してください。

```js
const WORKER_URL = "https://REPLACE-WITH-YOUR-WORKER.workers.dev";
```

Cloudflare Workerを公開して発行されたURLに置き換えます。
利用者の画面にはWorker URL欄は表示されません。

## 左右の幅変更

アイコン一覧とテンプレ領域の間の細い仕切りを左右へドラッグできます。
左を広げるとアイコン一覧の列数が自動で増えます。
幅はこのブラウザ内に保存されます。


## ヘッダー
上部は細いツールバー型に変更。文字・入力欄を小さくし、制作画面を広く使えるデザインです。
