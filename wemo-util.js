// 2016/09/22 Hiroyuki Matsuo <h-matsuo@ist.osaka-u.ac.jp>
// WeMo Insight Switch を Node.js から操作するツール

var fs      = require('fs');
var ajax    = require('superagent');
var search  = require('./lib/search.js');
var request = require('./lib/request.js');

// エントリポイント
if (require.main === module) {
    main();
}

function main() {

    // コマンドライン引数を取得
    var argv = process.argv;
    argv.shift(); argv.shift(); // 先頭の node wemo-util は削除

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
    console.log('Looking for WeMo Insight Switch...');
    search(function (location) {
        if (location === null) {
            console.log('No WeMo Insight Switches are found.');
        } else {
            console.log('WeMo Insight Switch has found:');
            console.log(location);
        }
    });
}

/*
function exec_track(argv) {
    console.log('Start tracking...');
    console.log('"Ctrl + C" to quit.')
    setInterval(function () {
        search(function (location) {
            if (location === null) {
                console.log('Error: No WeMo Insight Switches are found.');
                return;
            }
            request(location, function (log_entry) {
                if (log_entry === null) return;
                if (argv[0] === '--restheart') {
                    // Ajax で RESTHeart に送信
                    ajax
                        .post(argv[1])  // URL
                        .set('Content-Type', 'application/json')
                        .send(JSON.stringify(log_entry, null, '    '))
                        .end(function(err, res){
                            if (err !== null) {
                                console.log('Error: Problem with inserting document to MongoDB:');
                                console.log(err);
                                return;
                            }
                        });
                } else {
                    // log.txt ファイルに追記
                    fs.appendFile('./log.txt', JSON.stringify(log_entry, null, '    '), 'utf8', function (err) {
                        console.log('Error: Can\'t append log data to the file.');
                        return;
                    });
                }
            });
        });
    }, 1000);
}
*/

function exec_track(argv) {
    console.log('Start tracking...');
    console.log('"Ctrl + C" to quit.');
    track(argv);
}

function track(argv) {
    console.log('Looking for WeMo Insight Switch...');
    var interval_id;
    // WeMo が見つかるまで繰り返す
    interval_id = setInterval(function () {
        search(function (location) {
            if (location === null) {
                console.log('Error: No WeMo Insight Switches are found; I\'ll try again in 1 sec...');
                return;
            }
            console.log('WeMo Insight Switch has found:');
            console.log(location);
            clearInterval(interval_id);
            // WeMo へのリクエストが失敗するまで繰り返す
            interval_id = setInterval(function () {
                request(location, function (log_entry) {
                    if (log_entry === null) {
                        clearInterval(interval_id);
                        track();
                        return;
                    }
                    // Ajax で RESTHeart に送信
                    if (argv[0] === '--restheart') {
                        ajax
                            .post(argv[1])  // URL
                            .set('Content-Type', 'application/json')
                            .send(JSON.stringify(log_entry, null, '    '))
                            .end(function(err, res){
                                if (err !== null) {
                                    console.log('Error: Problem with inserting document to MongoDB:');
                                    console.log(err);
                                    return;
                                }
                            });
                    // log.txt ファイルに追記
                    } else {
                        fs.appendFile('./log.txt', JSON.stringify(log_entry, null, '    '), 'utf8', function (err) {
                            if (err) {
                                console.log('Error: Can\'t append log data to the file.');
                                return;
                            }
                        });
                    }
                });
            }, 1000);
        });
    }, 1000);
}
