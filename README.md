# wemo-util

Utility Tool for [WeMo Insight Switch](http://www.belkin.com/us/support-product?pid=01t80000003JS3FAAW) by [Hiroyuki Matsuo](http://sdl.ist.osaka-u.ac.jp/~h-matsuo/)

## Requirements

* [Node.js](https://nodejs.org/)

* [MongoDB](https://www.mongodb.com/) *(optional)*

* [RESTHeart](http://restheart.org/) *(optional)*

## Usage

```
Usage: node [--log <path>] wemo-util <command> [<args>]

wemo-util は，Node.js から同一ローカルネットワーク内の WeMo Insight Switch を
操作することができるユーティリティツールです．
Node v4.5.0 での動作を確認しています．

次のオプションが使用できます：

--log <path>
        ログを <path> で示す外部ファイルに出力します．

次のコマンドが使用できます：

help
        このテキストを表示します．

search
        同一ローカルネットワーク内の WeMo Insight Switch を検索し，
        そのロケーション（ホストおよびポート番号），シリアル番号，および
        MAC アドレスを調べます．

track <host>:<port> [--restheart <URI>]
        <host>:<port> で指定した WeMo Insight Switch に接続されている機器の
        電力消費状況などを，約 1 秒ごとに監視します．
        ログデータは，デフォルトではカレントディレクトリに書き出します．
        --restheart を指定すると，<URI> の RESTHeart にログデータを送信します．
        <URI> := http://<host>:<port>/<data_base>/<collection>/
```
