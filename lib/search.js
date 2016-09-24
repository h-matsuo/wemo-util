// 2016/09/22 Hiroyuki Matsuo <h-matsuo@ist.osaka-u.ac.jp>
// 同一ローケルネットワーク上の WeMo Insight Switch を検索し，その LOCATION を調べる

module.exports = search;

/*
 * callback(location)
 * location = null if not found
 */
function search(callback) {

    // WeMo が見つかったかどうかのフラグ
    var found = false;

    // SSDP ライブラリ node-ssdp を用いる
    var Client = require('node-ssdp').Client;
    var client = new Client();

    // 発見時の処理
    client.on('response', function (headers, status_code, rinfo) {
        found = true;
        var str = headers.LOCATION.substring(7); // 192.168.x.y:zzzz/setup.xml
        var host = str.substring(0, str.indexOf(':'));
        var port = str.substring(str.indexOf(':') + 1, str.indexOf('/'));
        var location = {
            'host': host,
            'port': port
        };
        if (callback !== undefined) callback(location);
    });

    // WeMo Insight Switch のみ検索
    // WeMo Switch はヒットしない(はず)
    client.search('urn:Belkin:service:insight:1');

    // タイムアウト処理
    setTimeout(function () {
        client.stop();
        if (!found && callback !== undefined) callback(null);
    }, 1000);

}
