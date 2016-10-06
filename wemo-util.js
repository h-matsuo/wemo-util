/*
 * wemo-util.js:
 * WeMo Insight Switch を Node.js から操作するツール
 * 
 * Hiroyuki Matsuo <h-matsuo@ist.osaka-u.ac.jp>
 */

var util = require('./lib/util.js');

// エントリポイント
if (require.main === module) {
    main();
}

function main() {

    // コマンドライン引数を取得
    var argv = process.argv;
    argv.shift(); argv.shift(); // 先頭の node wemo-util は削除

    // ログファイルの出力先を取得
    if (argv[0] === '--log') {
        util.printLog.outputPath = argv[1];
        argv.shift(); argv.shift();
    }

    // コマンドが指定されていなければ Usage を表示
    if (argv.length < 1) {
        util.printUsage();
        return;
    }

    // コマンドに対応した操作を実行
    switch (argv[0]) {
        case 'help':
            execHelp();
            break;
        case 'search':
            execSearch();
            break;
        case 'track':
            argv.shift();
            execTrack(argv);
            break;
        default:
            console.log('ERROR: ' + argv[0] + ': undefined command or option;');
            console.log('       See "node wemo-util help".');
            return;
    }

}


// help コマンドの実行
function execHelp() {
    util.printUsage();
}

// search コマンドの実行
function execSearch() {

    util.printLog('Searching for WeMo Insight Switch...')

    util.searchWemo(2500, function (locations) {

        if (locations.length < 1) {
            util.printLog('Not found.');
            return;
        }

        util.printLog('Found: ' + locations.length + ' device(s) in LAN.');

        var number = 1;
        for (var index = 0; index < locations.length; index++) {
            util.getDevInfo(locations[index], function (err, info) {
                util.printLog('WeMo #' + number + ':', true);
                if (err) {
                    util.printLog('    ERROR: Can\'t get device information.', true);
                    number++;
                    return;
                }
                var foundWemo = '           host: ' + info.host + '\n' +
                                '           port: ' + info.port + '\n' +
                                '     Serial No.: ' + info.serial_no + '\n' +
                                '    MAC Address: ' + info.mac_addr;
                util.printLog(foundWemo, true);
                number++;
            });
        }

    });
}

// track コマンドの実行
function execTrack(argv) {

    // <host>:<port> を指定しているかどうかチェック
    if (argv.length < 1 || argv[0].indexOf(':') === -1) {
        console.log('ERROR: Indicate location of WeMo;');
        console.log('       See "node wemo-util help".');
        return;
    }
    var location = {
        'host': argv[0].substring(0, argv[0].indexOf(':')),
        'port': argv[0].substring(argv[0].indexOf(':') + 1)
    }
    argv.shift();

    // --restheart オプションを確認
    var restheartURI = null;
    if (argv.length > 0) {
        switch (argv[0]) {
            case '--restheart':
                if (argv[1] === undefined) {
                    console.log('ERROR: Indicate URI of RESTHeart;');
                    console.log('       See "node wemo-util help".');
                    return;
                }
                restheartURI = argv[1];
                break;
            default:
                console.log('ERROR: ' + argv[0] + ': undefined option;');
                console.log('       See "node wemo-util help".');
                return;
        }
    }

    util.getDevInfo(location, function (err, info) {
        if (err) {
            util.printLog('    ERROR: Can\'t get device information.', true);
            return;
        }
        util.printLog('Found selected WeMo successfully.');
        util.printLog('WeMo info:', true);
        var foundWemo = '           host: ' + info.host + '\n' +
                        '           port: ' + info.port + '\n' +
                        '     Serial No.: ' + info.serial_no + '\n' +
                        '    MAC Address: ' + info.mac_addr;
        util.printLog(foundWemo, true);
        util.printLog('Start tracking WeMo...');
        console.log('"Ctrl + c" to quit.');
        util.trackWemo(location, restheartURI);
    });

}
