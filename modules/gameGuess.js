/**
 * Created by ben on 14/11/7.
 */
var base = require('./baseUtil.js');
var config = require('./gameConfig.js');

/*
业务规则：
如果今天是交易日，则直接返回今天
如果今天不是交易日，则往前取1天，直到取到最近一个交易日为止
 */
exports.getLatestTradeDay = function(){
    var date = new Date();
    while (!isTradeDay(date)) {
        date = date.DateAdd('d', -1);
    }

    return base.getDateString(date);
};

/*
业务规则：
如果今天是交易日，则判断，当前时间是不是在13点以前
如果是13点以前，则可押注的交易日就是今天
如果是13点以后，则需要去求下一个交易日
当然，如果今天的时间已经超过13点，则直接求下一个交易日
 */
exports.getChipinTradeDay = function() {
    return getChipinTradeDay();
};

/*
业务规则：
如果是 周六 周日，则不是交易日
如果是 国家法定假日，则不是交易日
 */
function isTradeDay(date) {
    var datePart = date.DatePart('w');
    if (datePart == '日' || datePart == '六') {
        return false;
    }

    var dateString = base.getDateString(date);
    for (var i=0; i<global.__noTradeDay.thisYear.length; ++i) {
        var ntd = global.__noTradeDay.thisYear[i];
        if (ntd == dateString) {
            return false;
        }
    }

    return true;
}

function getChipinTradeDay() {
    var date = new Date();
    if (isTradeDay(date)) {
        var h = date.DatePart('h');
        var m = date.DatePart('n');
        if (h < 13) {
            return base.getDateString(date);
        }
    }

    //今天是非交易日 或者 交易日的13点以后
    date = date.DateAdd('d', 1);
    while (!isTradeDay(date)) {
        date = date.DateAdd('d', 1);
    }

    return base.getDateString(date);
}


/*
获取用户信息
 */
exports.getMyInfo = function(deviceid, res) {
    if (base.notNullOrEmpty(deviceid)) {
        var conn = base.createConnector();
        var chipDay = getChipinTradeDay();
        var params = [
            deviceid,
            chipDay
        ];

        var direct = -1;
        var money = 0;
        var tradedate = '1900-1-1';
        var state = -1;
        var winmoney = 0;

        conn.query('SELECT direct,money,tradedate,state,winmoney FROM game_mainguess WHERE deviceid=? AND tradedate=?',
            params, function (err, rows, fields) {
                if (rows && rows.length > 0) {


                    var item = rows[0];
                    direct = item['direct'];
                    money = item['money'];
                    tradedate = base.getDateString(item['tradedate']);
                    state = item['state'];
                    winmoney = item['winmoney'];
                }

                conn.query('SELECT money, frazemoney FROM game_score WHERE deviceid=?',
                    [deviceid], function(err, rows, fields) {
                        if (rows && rows.length > 0) {
                            var item = rows[0];
                            var results = [{
                                chipdirect  :direct,
                                chipmoney   :money,
                                chipday     :tradedate,
                                chipstate   :state,
                                chipwinmoney:winmoney,
                                money       :item['money'],
                                frazemoney  :item['frazemoney']
                            }];

                            res.send(results);
                        }

                        conn.end();
                    });
            });
    }
};

/*
消费类型：
0=普通收入
1=普通支出
2=猜大盘收入
3=猜大盘支出
4=做任务收入
5=兑换支出
 */
exports.doChipin = function(deviceid, chipday, money, chipdirect, res) {
    if (base.notNullOrEmpty(deviceid) &&
        base.notNullOrEmpty(chipday) &&
        base.notNullOrEmpty(money) &&
        base.notNullOrEmpty(chipdirect)) {

        var conn = base.createConnector();

        conn.query('SELECT money,frazemoney FROM game_score WHERE deviceid=?',
            [deviceid], function(err, rows, fields) {
                if(err) {
                    res.send([
                        { err: err.code}
                    ]);
                    conn.end();
                } else {

                    if (rows.length > 0) {
                        var balance = rows[0]['money'];
                        var frazemoney = rows[0]['frazemoney'];

                        //如果余额充足，扣减余额，并执行竞猜买入，需要事务保证
                        if (balance >= money) {
                            conn.beginTransaction(function (err) {

                                if (err) {
                                    res.send([
                                        { err: '999', message : '系统错误'}
                                    ]);
                                } else {
                                    //更新余额
                                    conn.query('UPDATE game_score SET money=? WHERE deviceid=?',
                                        [balance - money , deviceid], function (err, rows, fields) {

                                            if (err) {
                                                conn.rollback(function () {
                                                    res.send([
                                                        { err: '999', message : '系统错误'}
                                                    ]);
                                                });
                                            } else {
                                                //插入消费记录
                                                conn.query('INSERT INTO game_scoredetails SET ?',
                                                    {
                                                        deviceid: deviceid,
                                                        money: money,
                                                        opttype: 3,
                                                        state: 0,
                                                        addtime: base.getDateTimeString()
                                                    }, function (err, rows, fields) {

                                                        if (err) {
                                                            conn.rollback(function () {
                                                                res.send([
                                                                    { err: '999', message : '系统错误'}
                                                                ]);
                                                            });
                                                        } else {
                                                            //插入竞猜记录
                                                            conn.query('INSERT INTO game_mainguess SET ?',
                                                                {
                                                                    deviceid: deviceid,
                                                                    direct: chipdirect,
                                                                    money: money,
                                                                    tradedate: chipday,
                                                                    state: 0,
                                                                    chipintime: base.getDateTimeString(),
                                                                    winmoney: 0
                                                                }, function (err, rows, fields) {

                                                                    if (err) {
                                                                        conn.rollback(function () {
                                                                            res.send([
                                                                                { err: '999', message : '系统错误'}
                                                                            ]);
                                                                        });
                                                                    } else {
                                                                        conn.commit(function (err) {
                                                                            if (err) {
                                                                                conn.rollback(function () {
                                                                                    res.send([
                                                                                        { err: '999', message : '系统错误'}
                                                                                    ]);
                                                                                })
                                                                            }
                                                                        });

                                                                        var results = [{
                                                                            chipdirect  :chipdirect,
                                                                            chipmoney   :money,
                                                                            chipday     :chipday,
                                                                            chipstate   :0,
                                                                            chipwinmoney:0,
                                                                            money       :balance-money,
                                                                            frazemoney  :frazemoney
                                                                        }];

                                                                        res.send(results);
                                                                        conn.end();
                                                                    }
                                                                });
                                                        }
                                                    });
                                            }

                                        });
                                }
                            });

                        } else {
                            res.send([
                                { err: '001', message : '金币余额不足'}
                            ]);
                            conn.end();
                        }

                    } else {
                        res.send([
                            { err: '001', message : '金币余额不足'}
                        ]);
                        conn.end();
                    }
                }

            });

    }
}
