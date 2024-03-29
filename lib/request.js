// 2016/09/22 Hiroyuki Matsuo <h-matsuo@ist.osaka-u.ac.jp>
// 指定した LOCATION の WeMo Insight Switch にリクエストを送信し，レスポンスを取得する

module.exports = request;

var convert_date = require('./convert_date.js');

/**
 * callback(err, log_entry)
 */
function request(location, callback) {

    var http = require('http');

    var service = 'insight';            // WeMo が提供するサービス
    var action  = 'GetInsightParams';   // そのサービスが提供するアクション

    var req_data =
        '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\n' +
        '  <s:Body>\n' +
        // サービスタイプとアクションを指定
        '    <u:' + action + ' xmlns:u="urn:Belkin:service:' + service + ':1">\n' +
        '    </u:' + action + '>\n' +
        '  </s:Body>\n' +
        '</s:Envelope>\n';

    var req_options = {
        'host'   : location.host,   // WeMo の IP アドレス
        'port'   : location.port,   // WeMo のポート番号
        'path'   : '/upnp/control/' + service + '1',    // サービスの controlURL
        'method' : 'POST',
        'headers': {
            'SOAPACTION'    : '"urn:Belkin:service:' + service + ':1#' + action + '"', // "サービスタイプ#アクション"
            'Content-Length': req_data.length,
            'Content-Type'  : 'text/xml; charset="utf-8"',
            'User-Agent'    : 'CyberGarage-HTTP/1.0' // iPhone アプリと同じ User-Agent
        }
    };

    // リクエストを送った時間を記録する変数
    var request_date, start_time;

    var req = http.request(req_options, function (res) {
        // レスポンスを受けとるまでの遅延時間を計測
        var diff = process.hrtime(start_time);
        // console.log('STATUS: ' + res.statusCode);
        // console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            //console.log('BODY: ' + chunk);
            var log_entry = convert_to_json(request_date, diff, chunk);
            if (callback !== undefined) callback(null, log_entry);
        });
    });

    req.on('error', function (err) {
        if (callback !== undefined) callback(err.message, null);
    });

    // リクエストを送った時間を記録
    request_date = new Date();
    start_time   = process.hrtime();

    req.write(req_data);

    req.end();

}

// レスポンスデータを JSON 形式に変換
function convert_to_json(date_obj, diff, chunk) {
    //var date_str   = convert_date(date_obj);
    var delay_msec = (diff[0] * 1E9 + diff[1]) / 1E6;
    var response   = parse_response(chunk);
    //var date_since = convert_date(new Date(response.since * 1000)).substring(0, 19);
    var date_since = new Date(response.since * 1000);
    var data = {
        //'date'          : date_str,
        'date'          : date_obj,
        'delay_msec'    : delay_msec,
        'current_mw'    : response.current_mw,
        'state'         : response.state,
        'since'         : date_since,
        'on_now_for_sec': response.on_now_for_sec,
        'today_sec'     : response.today_sec,
        'total_sec'     : response.total_sec,
        'today_mw'      : response.today_mw,
        'total_mw'      : response.total_mw
    };
    return data;
}

// WeMo からのレスポンスを解析して整形
function parse_response(response) {
    var start_index = response.indexOf('<InsightParams>') + ('<InsightParams>').length;
    var end_index   = response.indexOf('</InsightParams>');
    var raw_data = response.substring(start_index, end_index).split('|');
    var data = {
        'state'          : Number(raw_data[0]),
        'since'          : Number(raw_data[1]),
        'on_now_for_sec' : Number(raw_data[2]),
        'today_sec'      : Number(raw_data[3]),
        'total_sec'      : Number(raw_data[4]),
        'time_period'    : Number(raw_data[5]),
        '_x'             : Number(raw_data[6]),
        'current_mw'     : Number(raw_data[7]),
        'today_mw'       : Number(raw_data[8]),
        'total_mw'       : Number(raw_data[9]),
        'power_threshold': Number(raw_data[10]),
    };
    return data;
}
