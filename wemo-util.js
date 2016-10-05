// 2016/09/22 Hiroyuki Matsuo <h-matsuo@ist.osaka-u.ac.jp>
/*
 * wemo-util.js:
 * WeMo Insight Switch を Node.js から操作するツール
 */

var util = require('./lib/util.js');

// エントリポイント
if (require.main === module) {
    main();
}

function main() {
    var location = {
        'host': '192.168.146.113',
        'port': 49153
    }
    execSearch();
}


// search コマンドの実行
function execSearch() {
    printLog('Searching for WeMo Insight Switch...')
    util.searchWemo(1000, function (locations) {
        if (locations.length < 1) {
            printLog('Not found.');
            return;
        }
        printLog('Found: ' + locations.length + ' device(s) in LAN.');
        var number = 1;
        for (var index = 0; index < locations.length; index++) {
            util.getDevInfo(locations[index], function (err, info) {
                printLog('#' + number + ':', true);
                if (err) {
                    printLog('    ERROR: Cannot get device information.', true);
                    number++;
                    return;
                }
                var foundWemo = '           host: ' + info.host + '\n' +
                                '           port: ' + info.port + '\n' +
                                '     Serial No.: ' + info.serial_no + '\n' +
                                '    MAC Address: ' + info.mac_addr;
                printLog(foundWemo, true);
                number++;
            });
        }
    });
}


// track コマンドの実行
function execTrack(argv) {
    // location 未指定時のエラー処理
    printLog('Start tracking...');
    console.log('"Ctrl + c" to quit.');
}

// ログの出力
function printLog(msg,       /* 出力する文字列 */
                  is_no_date /* 日付を出力しなくてよい場合は true */) {
    // 日付付きの出力
    if (is_no_date === false || is_no_date === undefined) {
        var date    = util.convertDate(new Date());
        var logData = '[' + date + '] ' + msg;
        console.log(logData);
    }
    // 日付なしの出力
    else {
        console.log(msg);
    }
/*
    var date = convert_date(new Date());
    var log_data = '[' + date + '] ' + msg;
    if (log_out === null) {
        console.log(log_data);
    } else {
        log_data += '\n';
        fs.appendFile(log_out, log_data, 'utf8', function (err) {
            if (err) {
                var file_path = log_out;
                log_out = null;
                console.log(log_data.substring(0, log_data.length - 1));
                print_log('Error: Can\'t open the log file: ' + file_path);
            }
        });
    }
*/
}


/*
var fs      = require('fs');
var ajax    = require('superagent');
var search  = require('./lib/search.js');
var request = require('./lib/request.js');
var convert_date = require('./lib/convert_date.js');

var log_out = null; // ログの出力先；null なら標準出力

function main() {

    // コマンドライン引数を取得
    var argv = process.argv;
    argv.shift(); argv.shift(); // 先頭の node wemo-util は削除

    // ログファイルの出力先を取得
    if (argv[0] === '--log') {
        log_out = argv[1];
        argv.shift(); argv.shift();
    }

    // コマンドが指定されていなければ Usage を表示
    if (argv.length < 1) {
        print_usage();
        return;
    }

    // コマンドに対応した操作を実行
    switch (argv[0]) {
        case 'help':
            print_usage();
            break;
        case 'search':
            exec_search();
            break;
        case 'track':
            argv.shift();
            exec_track(argv);
            break;
        default:
            console.log('Error: ' + argv[0] + ': undefined command;');
            console.log('       See "node wemo-util help".');
            return;
    }

}

function print_usage() {
    console.log(fs.readFileSync('./usage.txt', 'utf8'));
}

function exec_search() {
    print_log('Looking for WeMo Insight Switch...');
    search(function (location) {
        if (location === null) {
            print_log('No WeMo Insight Switches are found.');
        } else {
            print_log('Found: ' + location.host + ':' + location.port);
        }
    });
}

function exec_track(argv) {
    print_log('Start tracking...');
    console.log('"Ctrl + c" to quit.');
    track_wemo(argv);
}

function track_wemo(argv) {
    print_log('Looking for WeMo Insight Switch...');
    var interval_id;
    // LAN 内の WeMo を探索 
    search(function (location) {
        if (location === null) {
            print_log('Error: No WeMo Insight Switches are found; I\'ll try again...');
            track_wemo(argv);   // WeMo を探しなおす
            return;
        }
        print_log('Found: ' + location.host + ':' + location.port);
        clearInterval(interval_id);
        // WeMo へのリクエストが失敗するまで繰り返す
        interval_id = setInterval(function () {
            request(location, function (err, log_entry) {
                if (err) {
                    clearInterval(interval_id);
                    print_log('Error: Problem with request to WeMo: ' + err);
                    track_wemo(argv);   // WeMo を探しなおす
                    return;
                }
                // Ajax で RESTHeart に送信
                if (argv[0] === '--restheart') {
                    ajax
                        .post(argv[1])  // URL
                        .set('Content-Type', 'application/json')
                        .send(JSON.stringify(log_entry, null, '    '))
                        .end(function(err, res){
                            if (err) {
                                print_log('Error: Problem with insertion to MongoDB:\n' + JSON.stringify(err, null, '    '));
                                return;
                            }
                        });
                // track.log ファイルに追記
                } else {
                    fs.appendFile('./track.log', JSON.stringify(log_entry, null, '    '), 'utf8', function (err) {
                        if (err) {
                            print_log('Error: Can\'t open the log file: track.log');
                            return;
                        }
                    });
                }
            });
        }, 1000);
    });
}

function print_log(msg) {
    var date = convert_date(new Date());
    var log_data = '[' + date + '] ' + msg;
    if (log_out === null) {
        console.log(log_data);
    } else {
        log_data += '\n';
        fs.appendFile(log_out, log_data, 'utf8', function (err) {
            if (err) {
                var file_path = log_out;
                log_out = null;
                console.log(log_data.substring(0, log_data.length - 1));
                print_log('Error: Can\'t open the log file: ' + file_path);
            }
        });
    }
}
*/
