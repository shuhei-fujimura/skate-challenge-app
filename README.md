# 全部チャレンジ

子供のスケートボード練習用Webアプリです。

- 技リストをカードで表示
- 「できた」を押すと、その日のカードから消える
- 日付が変わると自動でリセット
- 技名、種類、レベルで検索・絞り込み
- 各カードから動画検索を開ける

## GitHub Pages

このフォルダは静的ファイルだけで動くため、GitHub Pagesでそのまま公開できます。

公開対象ファイル:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `data/tricks.json`
- `data/sync_meta.json`
- `.nojekyll`

## 技リスト更新

Excelの技リストを更新したあと、ローカルで `sync_from_excel.py` を実行すると `data/tricks.json` を更新できます。
