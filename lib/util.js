// 2016/10/05 Hiroyuki Matsuo <h-matsuo@ist.osaka-u.ac.jp>
/*
 * 実装用のユーティリティ関数群
 */

module.exports = {
	'searchWemo' : searchWemo,
	'getDevInfo' : getDevInfo,
	'convertDate': convertDate
};


var sendRequest = require('./send-request.js');

// LAN 上の WeMo Insight Switch を検索し，その LOCATION を調べる
function searchWemo(timeout, /* タイムアウト時間 [ms] */
                    callback /* コールバック関数 */) {
// callback(locations /* 発見した WeMo の LOCATION 配列 */)
    // 発見した WeMo の一覧
    var locations = [];
    // SSDP ライブラリ node-ssdp を用いる
    var Client = require('node-ssdp').Client;
    var client = new Client();
    // 発見時の処理
    client.on('response', function (headers, statusCode, rinfo) {
        // ヘッダから LOCATION を抜き出す
        var str  = headers.LOCATION.substring(7); // 192.168.x.y:zzzz/setup.xml
        var host = str.substring(0, str.indexOf(':'));
        var port = str.substring(str.indexOf(':') + 1, str.indexOf('/'));
        var location = {
            'host': host,
            'port': port
        };
        locations.push(location);
    });
    // WeMo Insight Switch のみ検索
    // WeMo Switch はヒットしない(はず)
    client.search('urn:Belkin:service:insight:1');
    // タイムアウト処理
    setTimeout(function () {
        client.stop();
        if (callback) callback(locations);
    }, timeout);
}

// 指定した WeMo の情報を取得する
function getDevInfo(location, /* WeMo の LOCATION = {host, port} */
                    callback  /* コールバック関数 */) {
// callback(err, /* エラーメッセージ */
//          info /* WeMo の情報 info = {serial_no, mac_addr} */)
    sendRequest(location, 'basicevent', 'GetMacAddr', function (err, res) {
        if (err) {
            if (callback) callback(err, null);
            return;
        }
        var serialNo = res.body.substring(res.body.indexOf('<SerialNo>') + ('<SerialNo>').length, res.body.indexOf('</SerialNo>'));
        var macAddr  = res.body.substring(res.body.indexOf('<MacAddr>') + ('<MacAddr>').length, res.body.indexOf('</MacAddr>'));
        macAddr = macAddr.substring(0, 2) + ':' + macAddr.substring(2, 4) + ':' + macAddr.substring(4, 6) + ':' + macAddr.substring(6, 8) + ':' + macAddr.substring(8, 10) + ':' + macAddr.substring(10);
        var info = {
            'host'     : location.host,
            'port'     : location.port,
            'serial_no': serialNo,
            'mac_addr' : macAddr
        };
        if (callback) callback(null, info);
    });
}

// Date オブジェクトを読みやすい形式の文字列に変換
// 2016/09/22-09:59:30.005
function convertDate(date_obj /* 変換する Date オブジェクト */) {
    var year     = date_obj.getFullYear();
    var month    = date_obj.getMonth() + 1;
    var day      = date_obj.getDate();
    var hour     = date_obj.getHours();
    var min      = date_obj.getMinutes();
    var sec      = date_obj.getSeconds();
    var millisec = date_obj.getMilliseconds();
    if (month < 10) month = '0' + month;
    if (day   < 10) day   = '0' + day;
    if (hour  < 10) hour  = '0' + hour;
    if (min   < 10) min   = '0' + min;
    if (sec   < 10) sec   = '0' + sec;
    if (millisec < 10) millisec = '00' + millisec;
    else if (millisec < 100) millisec = '0' + millisec;
    return year + '/' + month + '/' + day + '-' + hour + ':' + min + ':' + sec + '.' + millisec;
}
