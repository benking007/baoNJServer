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
    return getLatestTradeDay();
};

/*
业务规则：
如果今天是交易日，则判断，当前时间是不是在13点以前
如果是13点以前，则可押注的交易日就是今天
如果是13点以后，则需要去求下一个交易日
当然，如果今天的时间已经超过13点，则直接求下一个交易日
 */
exports.getChipinTradeDay = function() {
    return getChipinTradeDay(13);
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

function getChipinTradeDay(splittime) {
    var date = new Date();
    if (isTradeDay(date)) {
        var h = date.DatePart('h');
        var m = date.DatePart('n');
        if (h < splittime) {
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

function getLatestTradeDay() {
    var date = new Date();
    while (!isTradeDay(date)) {
        date = date.DateAdd('d', -1);
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
                if (err) {
                    return base.handleError({message:'获取竞猜记录出错'}, res);
                }

                if (rows.length > 0) {

                    var item = rows[0];
                    direct = item['direct'];
                    money = item['money'];
                    tradedate = base.getDateString(item['tradedate']);
                    state = item['state'];
                    winmoney = item['winmoney'];
                }

                conn.query('SELECT money, frazemoney FROM game_score WHERE deviceid=?',
                    [deviceid], function(err, rows, fields) {
                        if (err) {
                            return base.handleError({message:'获取用户信息出错'}, res);
                        }

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
                    return base.handleError({message:'查询可用金币出错'}, res);
                } else {

                    if (!rows || rows.length == 0 || rows[0]['money'] < money) {
                        return base.handleError({message:'余额不足'}, res);
                    } else {
                        var balance = rows[0]['money'];
                        conn.beginTransaction(function (err) {
                            if (err) {
                                return base.handleError({message:'系统错误'}, res);
                            } else {
                                //更新余额
                                conn.query('UPDATE game_score SET money=? WHERE deviceid=?',
                                    [balance - money , deviceid], function (err, rows, fields) {
                                        if (err) {
                                            conn.rollback(function () {
                                                return base.handleError({message:'消费金币出错'}, res);
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
                                                            return base.handleError({message:'新增消费记录出错'}, res);
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
                                                                        return base.handleError({message:'新增下注出错'}, res);
                                                                    });
                                                                } else {
                                                                    conn.commit(function (err) {
                                                                        if (err) {
                                                                            conn.rollback(function () {
                                                                                return base.handleError({message:'提交下注出错'}, res);
                                                                            })
                                                                        } else {
                                                                            var results = [{
                                                                                chipdirect  :chipdirect,
                                                                                chipmoney   :money,
                                                                                chipday     :chipday,
                                                                                chipstate   :0,
                                                                                chipwinmoney:0,
                                                                                money       :balance-money,
                                                                                frazemoney  :0
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
                            }
                        });
                    }
                }
            });
    }
}

exports.getCoinPoolInfo = function(infocache, res) {
    var tradeDate = getChipinTradeDay(15);

    var results = infocache.get('poolinfo');
    if (results) {
        res.send(results);
        return;
    };

    var risemoney = 0;
    var downmoney = 0;
    var conn = base.createConnector();
    conn.query('SELECT sum(money) as risemoney FROM game_mainguess WHERE direct=1 AND tradedate=?',
        [tradeDate], function(err, rows, fields) {
            if (err) {
                return base.handleError({message:'查询奖池出错'}, res);
            }  else  {
                if (rows && rows.length > 0) {
                    risemoney = rows[0]['risemoney'];
                }

                conn.query('SELECT sum(money) as downmoney FROM game_mainguess WHERE direct=0 AND tradedate=?',
                    [tradeDate], function(err, rows, fields) {
                        if (err) {
                            return base.handleError({message:'查询奖池出错'}, res);
                        } else {
                            if (rows && rows.length > 0) {
                                downmoney = rows[0]['downmoney'];
                            }

                            var totalmoney = risemoney + downmoney;
                            var results = [{
                                tradedate : tradeDate,
                                risemoney : risemoney,
                                downmoney : downmoney,
                                totalmoney : totalmoney,
                                risepercent : risemoney/totalmoney*100,
                                downpercent : downmoney/totalmoney*100
                            }];

                            infocache.set('poolinfo', results, 1000 * 60 * 5);

                            res.send(results);
                            conn.end();
                        }
                    });
            }
        });
}
