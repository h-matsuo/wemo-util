/*
 * 実装用のユーティリティ関数群
 * 
 * Hiroyuki Matsuo <h-matsuo@ist.osaka-u.ac.jp>
 */

module.exports = {
    'searchWemo' : searchWemo,
    'trackWemo'  : trackWemo,
    'getDevInfo' : getDevInfo,
    'printLog'   : printLog,
    'printUsage' : printUsage
};


var fs = require('fs');
var ajax = require('superagent');
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

// 指定した WeMo の現在の電力消費などのデータを取得する
function getCurrentData(location, /* WeMo の LOCATION = {host, port} */
                        callback  /* コールバック関数 */) {
// callback(err, /* エラーメッセージ */
//          data /* WeMo の現在のデータ (JSON 形式) */)
    sendRequest(location, 'insight', 'GetInsightParams', function (err, res, date, delay) {
        if (err) {
            if (callback) callback(err, null);
            return;
        }
        var dataFromWemo = parseInsightParams(res);
        var currentData = {
            //'date'      : convertDate(date),
            'date': date,
            'delay_msec': delay,
            'data'      : {
                'current_mw'    : dataFromWemo.current_mw,
                'state'         : dataFromWemo.state,
                //'since'         : convertDate(new Date(dataFromWemo.since * 1000)),
                'since'         : new Date(dataFromWemo.since * 1000),
                'on_now_for_sec': dataFromWemo.on_now_for_sec,
                'today_sec'     : dataFromWemo.today_sec,
                'total_sec'     : dataFromWemo.total_sec,
                'today_mw'      : dataFromWemo.today_mw,
                'total_mw'      : dataFromWemo.total_mw
            }
        };
        if (callback) callback(null, currentData);
    });
    function parseInsightParams(res) {
        var startIndex = res.body.indexOf('<InsightParams>') + ('<InsightParams>').length;
        var endIndex   = res.body.indexOf('</InsightParams>');
        var rawData = res.body.substring(startIndex, endIndex).split('|');
        var data = {
            'state'          : Number(rawData[0]),
            'since'          : Number(rawData[1]),
            'on_now_for_sec' : Number(rawData[2]),
            'today_sec'      : Number(rawData[3]),
            'total_sec'      : Number(rawData[4]),
            'time_period'    : Number(rawData[5]),
            '_x'             : Number(rawData[6]),
            'current_mw'     : Number(rawData[7]),
            'today_mw'       : Number(rawData[8]),
            'total_mw'       : Number(rawData[9]),
            'power_threshold': Number(rawData[10]),
        };
        return data;
    }
}

// 指定した WeMo を監視する
function trackWemo(location,    /* WeMo の LOCATION = {host, port} */
                   restheartURI /* ログの書き込み先となる RESTHeart の URI */) {
    var intervalId = setInterval(function () {
        getCurrentData(location, function (err, data) {
            if (err) {
                clearInterval(intervalId);
                console.log('ERROR: Problem with request to WeMo: ' + err);
                return;
            }
            // track.log ファイルに追記
            if (restheartURI === null) {
                fs.appendFile('./track.log', JSON.stringify(data, null, '\t') + '\n', 'utf8', function (err) {
                    if (err) {
                        printLog('ERROR: Can\'t open the log file: track.log');
                        return;
                    }
                });
            }
            // Ajax で RESTHeart に送信
            else {
                ajax
                    .post(restheartURI) // URI
                    .set('Content-Type', 'application/json')
                    .send(data)
                    .end(function (err, res) {
                        if (err) {
                            printLog('ERROR: Problem with insertion to MongoDB.');
                            printLog(JSON.stringify(err, null, '    '), true);
                            return;
                        }
                    });
            }
        });
    }, 1000);
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

// ログの出力
// printLog.outputPath で出力先の外部ファイルを指定できる
function printLog(msg,    /* 出力する文字列 */
                  no_date /* 日時を出力しなくてよい場合は true */) {
    var outStr = msg;
    // 日時を追加
    if (no_date === false || no_date === undefined) {
        var date    = convertDate(new Date());
        outStr = '[' + date + '] ' + msg;
    }
    // 標準出力に出力する場合
    if (printLog.outputPath === undefined || printLog.outputPath === null) {
        console.log(outStr);
    }
    // 外部ファイルに出力する場合
    else {
        outStr += '\n';
        fs.appendFile(printLog.outputPath, outStr, 'utf8', function (err) {
            if (err) {
                var tmpPath = printLog.outputPath;
                printLog.outputPath = null;
                printLog('ERROR: Can\'t open the log file: ' + tmpPath);
                printLog(msg, no_date)
            }
        });
    }
}

// Usage の出力
function printUsage() {
    console.log(fs.readFileSync('./usage.txt', 'utf8'));
}
