# wemo-util

Utility Tool for [WeMo Insight Switch](http://www.belkin.com/us/support-product?pid=01t80000003JS3FAAW) by [Hiroyuki Matsuo](http://sdl.ist.osaka-u.ac.jp/~h-matsuo/)

## Requirements

* Node.js

* MongoDB

* RESTHeart

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
        そのロケーション（ホストおよびポート番号）を調べます．

track [--restheart <URL>]
        同一ローカルネットワーク内の WeMo Insight Switch に接続されている機器の
        電力消費状況などを，約 1 秒ごとに監視します．
        ログデータは，デフォルトではカレントディレクトリに書き出します．
        --restheart を指定すると，<URL> の RESTHeart にログデータを送信します．
        <URL> := http://<host>:<port>/<data_base>/<collection>/
```
