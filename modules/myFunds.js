/**
 * Created by ben on 14-6-23.
 */
var base = require('./baseUtil.js');

exports.getMyFund = function (deviceid, fundcode, res, view) {
    var conn = base.createConnector();
    var params = [
        deviceid,
        fundcode
    ];

    conn.query('SELECT deviceid,fundcode,quotient,totalincome,changedate,dailyincome FROM myfund WHERE deviceid=? AND fundcode=?',
        params, function (err, rows, fields) {
        if (rows.length > 0) {

            var item = rows[0];

            calcMyFund(
                item['deviceid'],
                item['fundcode'],
                item['quotient'],
                item['totalincome'],
                item['changedate'],
                item['dailyincome'],
                conn, res, view);

        }else{

            var results = [{
                deviceid    :deviceid,
                fundcode    :fundcode,
                quotient    :0.00,
                dailyincome :0.00,
                totalincome :0.00,
                changedate  :base.getDateString(),
                netvalues   :eval('global.__aryCurrFunds.f_' + fundcode)
            }];

            if (view) {
                res.render('myfund', results[0]);
            }else{
                res.send(results);
            }

            conn.end();
        }
    });
};

exports.setMyFund = function (deviceid, fundcode, quotient, totalincome, res) {
    if (base.notNullOrEmpty(quotient) &&
        base.notNullOrEmpty(totalincome) &&
        base.notNullOrEmpty(deviceid) &&
        base.notNullOrEmpty(fundcode)) {

        var conn = base.createConnector();
        var dateTimeString = base.getDateTimeString();

        var params = [
            deviceid,
            fundcode
        ];

        var fund = eval('global.__aryCurrFunds.f_' + fundcode);
        var dailyincome = quotient * fund.netvalue / 10000;

        conn.query('SELECT id,totalincome FROM myfund WHERE deviceid=? AND fundcode=?', params, function (err, rows, fields){
            if(rows.length == 0){

                if (parseFloat(totalincome) < 0) {
                    totalincome = 0;
                }

                params = {
                    deviceid    :deviceid,
                    fundcode    :fundcode,
                    quotient    :quotient,
                    totalincome :totalincome,
                    dailyincome :dailyincome,
                    changedate  :fund.nvdate,
                    addtime     :dateTimeString
                };

                conn.query('INSERT INTO myfund SET ?', params, function (err, rows, fields){
                    var results = [{
                        deviceid    : deviceid,
                        fundcode    : fundcode,
                        quotient    : quotient,
                        dailyincome : dailyincome,
                        totalincome : totalincome,
                        changedate  : fund.nvdate,
                        netvalues   : fund
                    }];

                    //添加日收益
                    addDailyIncomeSql(deviceid,fundcode,dailyincome,totalincome,quotient,
                        fund.netvalue,fund.totalnetvalue,fund.nvdate);

                    res.send(results);
                    conn.end();
                });

            }else{

                var item = rows[0];
                var orginTotalincome = item['totalincome'];
                if (parseFloat(totalincome) < 0) {
                    totalincome = orginTotalincome;
                }

                params = [
                    quotient,
                    totalincome,
                    fund.nvdate,
                    dailyincome,
                    deviceid,
                    fundcode
                ];

                conn.query('UPDATE myfund SET quotient=?,totalincome=?,changedate=?,dailyincome=? WHERE deviceid=? AND fundcode=?',
                    params, function(err, rows, fields){
                        var results = [{
                            deviceid    : deviceid,
                            fundcode    : fundcode,
                            quotient    : quotient,
                            dailyincome : dailyincome,
                            totalincome : totalincome,
                            changedate  : fund.nvdate,
                            netvalues   : fund
                        }];

                        //添加日收益
                        addDailyIncomeSql(deviceid,fundcode,dailyincome,totalincome,quotient,
                            fund.netvalue,fund.totalnetvalue,fund.nvdate);

                        res.send(results);
                        conn.end();
                    }
                );
            }
        });
    }
};

exports.executeDailyIncomeSql = function() {
    if(!global.__insertExecuting) {
        global.__insertExecuting = true;
        __executeDailyIncomeSql();
    }
}

function __executeDailyIncomeSql() {
    var sqlObj = global.__aryDailyIncomeSqlQueue.pop();
    if (sqlObj) {
        var conn = base.createConnector();
        conn.query(sqlObj.delete, function (err, rows, fileds) {
            conn.query(sqlObj.insert, function (err, rows, fields) {
                conn.end();
                __executeDailyIncomeSql();
            });
        });
    } else {
        global.__insertExecuting = false;
    }
}

function addDailyIncomeSql(deviceid, fundcode, dailyincome, totalincome, quotient, netvalue, totalnetvalue, calcdate){
    var deleteSql = "DELETE FROM myfunddailyincome WHERE deviceid='{0}' AND fundcode='{1}' AND calcdate='{2}'";
    var insertSql = "INSERT INTO myfunddailyincome(deviceid,fundcode,dailyincome,totalincome,quotient,netvalue,totalnetvalue,calcdate,addtime) ";
    insertSql += "VALUES ('{0}','{1}',{2},{3},{4},{5},{6},'{7}','{8}')";
    var sqlObj = {delete:'',insert:''};

    sqlObj.delete = deleteSql.format(deviceid,fundcode,calcdate);
    sqlObj.insert = insertSql.format(deviceid,fundcode,dailyincome,totalincome,quotient,netvalue,totalnetvalue,calcdate,base.getDateTimeString());

    global.__aryDailyIncomeSqlQueue.push(sqlObj);
}

function calcMyFund(deviceid, fundcode, quotient, totalincome, changedate, dailyincome, conn, res, view) {
    var params = [
        fundcode,
        changedate
    ];

    conn.query('SELECT netvalue, totalnetvalue, nvdate FROM netvalue WHERE fundcode=? AND nvdate >? ORDER BY nvdate ASC',
        params, function(err, rows, fields){
            if(rows.length > 0){

                var latestNetValue = rows[rows.length - 1];

                for (var i=0; i<rows.length - 1; ++i) {
                    var item = rows[i];
                    var netValue = item['netvalue'];
                    var totalNetValue = item['totalnetvalue'];
                    var nvDate = item['nvdate'];
                    var income = netValue * quotient / 10000;
                    quotient += income;
                    totalincome += income;

                    //添加日收益
                    addDailyIncomeSql(deviceid,fundcode,income,totalincome,quotient,
                        netValue,totalNetValue,nvDate.format('yyyy-MM-dd'));
                }

                var dailyIncome = latestNetValue['netvalue'] * quotient / 10000;
                changedate = latestNetValue['nvdate'];
                quotient += dailyIncome;
                totalincome += dailyIncome;

                //添加日收益
                addDailyIncomeSql(deviceid,fundcode,dailyIncome,totalincome,quotient,
                    latestNetValue['netvalue'],latestNetValue['totalnetvalue'],latestNetValue['nvdate'].format('yyyy-MM-dd'));

                params = [
                    quotient,
                    totalincome,
                    dailyIncome,
                    changedate,
                    deviceid,
                    fundcode
                ];

                conn.query('UPDATE myfund SET quotient=?,totalincome=?, dailyincome=?,changedate=? WHERE deviceid=? AND fundcode=?',
                    params, function (err, rows, fileds) {
                        var results = [{
                            deviceid: deviceid,
                            fundcode: fundcode,
                            quotient: quotient,
                            dailyincome: dailyIncome,
                            totalincome: totalincome,
                            changedate: changedate,
                            netvalues   :eval('global.__aryCurrFunds.f_' + fundcode)
                        }];

                        if (view) {
                            res.render('myfund', results[0]);
                        }else{
                            res.send(results);
                        }

                        conn.end();
                    }
                );

            }else{

                var results = [{
                    deviceid    :deviceid,
                    fundcode    :fundcode,
                    quotient    :quotient,
                    dailyincome :dailyincome,
                    totalincome :totalincome,
                    changedate  :changedate,
                    netvalues   :eval('global.__aryCurrFunds.f_' + fundcode)
                }];

                if (view) {
                    res.render('myfund', results[0]);
                }else{
                    res.send(results);
                }

                conn.end();
            }
        }
    );
}