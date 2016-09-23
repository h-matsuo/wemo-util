# wemo-util

WeMo Insight Switch Utility Tool

## Requirements

* Node.js

* MongoDB

* RESTHeart

## Usage

`Usage: node wemo-util <command> [<args>]`

wemo-util は，Node.js から同一ローカルネットワーク内の WeMo Insight Switch を
操作することができるユーティリティツールです．
Node v4.4.4 での動作を確認しています．

次のコマンドが使用できます：

`help`
        このテキストを表示します．

`search`
        同一ローカルネットワーク内の WeMo Insight Switch を検索し，
        そのロケーション（ホストおよびポート番号）を調べます．

`track [--restheart <URL>]`
        同一ローカルネットワーク内の WeMo Insight Switch に接続されている機器の
        電力消費状況などを，約 1 秒ごとに監視します．
        ログデータは，デフォルトではカレントディレクトリに書き出します．
        `--restheart` を指定すると，`<URL>` の RESTHeart にログデータを送信します．
        `<URL> = http://<host>:<port>/<data_base>/<collection>/`
