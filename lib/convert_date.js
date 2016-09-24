// 2016/09/24 Hiroyuki Matsuo <h-matsuo@ist.osaka-u.ac.jp>
// Date オブジェクトを 2016/09/22 09:59:30.005 形式の文字列に変換する

module.exports = convert_date;

function convert_date(date_obj) {
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
