/*
 * 指定した LOCATION の WeMo Insight Switch に指定したリクエストを送信し，レスポンスを取得する
 * リクエストを送信した日時，およびレスポンスが返るまでの delay [msec] も計測する
 * 
 * Hiroyuki Matsuo <h-matsuo@ist.osaka-u.ac.jp>
 */

module.exports = sendRequest;


var http = require('http');

// 指定した WeMo にリクエストを送信する
function sendRequest(location, /* WeMo の LOCATION = {host, port} */
                     service,  /* 実行するサービス名 */
                     action,   /* 実行するアクション名 */
                     callback  /* コールバック関数 */) {
// callback(err,  /* エラーメッセージ */
//          res,  /* レスポンスデータ res = {status_code, headers, body} */
//          date, /* リクエストを送信した日時 (Date 型) */
//          delay /* レスポンスが返るまでの delay [msec] */)

    var reqData =
        '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\n' +
        '  <s:Body>\n' +
        // サービスタイプとアクションを指定
        '    <u:' + action + ' xmlns:u="urn:Belkin:service:' + service + ':1">\n' +
        '    </u:' + action + '>\n' +
        '  </s:Body>\n' +
        '</s:Envelope>\n';

    var reqOptions = {
        'host'   : location.host,   // WeMo の IP アドレス
        'port'   : location.port,   // WeMo のポート番号
        'path'   : '/upnp/control/' + service + '1',    // サービスの controlURL
        'method' : 'POST',
        'headers': {
            'SOAPACTION'    : '"urn:Belkin:service:' + service + ':1#' + action + '"', // "サービスタイプ#アクション"
            'Content-Length': reqData.length,
            'Content-Type'  : 'text/xml; charset="utf-8"',
            'User-Agent'    : 'CyberGarage-HTTP/1.0' // iPhone アプリと同じ User-Agent
        }
    };

    var req = http.request(reqOptions, function (res) {
        // レスポンスを受けとるまでの遅延時間を計測
        var diff  = process.hrtime(startTime);
        var delay = (diff[0] * 1E9 + diff[1]) / 1E6;

        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            var resData = {
                'status_code': res.statusCode,
                'headers'    : res.headers,
                'body'       : chunk
            };
            if (callback) callback(null, resData, sentDate, delay);
        });
    });

    req.on('error', function (err) {
        if (callback) callback(err.message, null, sentDate, null);
        return;
    })

    // リクエストを送信した時間を記録
    var sentDate  = new Date();
    var startTime = process.hrtime();

    req.write(reqData);

    req.end();

}
