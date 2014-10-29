/**
 * Created by ben on 14-6-24.
 */
var base = require('./baseUtil.js');
var http = require('http');

exports.getNetValue = function (fundcode, res) {
    var conn = base.createConnector();

    conn.query('SELECT fundcode, netvalue, totalnetvalue, nvdate FROM netvalue WHERE fundcode=? ORDER BY nvdate DESC LIMIT 1',
        [fundcode], function (err, rows, fields) {
            res.send(rows);
            conn.end();
        }
    );
};

exports.getFunds = function (res) {
    for(var i=0; i<global.__aryFunds.length; ++i) {
        var fund = global.__aryFunds[i];
        var currFund = eval('global.__aryCurrFunds.f_' + fund.fundcode);
        fund.netvalue = currFund.netvalue;
        fund.totalnetvalue = currFund.totalnetvalue;
        fund.nvdate = currFund.nvdate;
    }
    res.send(global.__aryFunds);
};

exports.spiderNetValue = function(){
    for(var i=0; i<global.__aryFunds.length; ++i) {
        var fund = global.__aryFunds[i];
        spiderNetValue(fund.fundcode);
    }
};

function spiderNetValue(fundcode){
    var req = http.request('http://hq.sinajs.cn/?list=f_' + fundcode, function(res){
        res.setEncoding('utf-8');
        var g_data="";
        res.on('data', function (chunk){
            g_data += chunk;
        });

        res.on('end', function(){
            processData(fundcode, g_data);
        });
    });

    req.end();
}

function processData(fundcode, g_data){
    g_data = g_data.replace('var hq_str_f_' + fundcode + '="','').replace('";','');
    var dataArray = g_data.split(',');
    var netValue = dataArray[1];
    var totalNetValue = dataArray[2];
    var nvDate = dataArray[4];

    var fund = eval('global.__aryCurrFunds.f_' + fundcode);
    fund.netvalue = netValue;
    fund.totalnetvalue = totalNetValue;
    fund.nvdate = nvDate;

    var conn = base.createConnector();

    conn.query('SELECT fundcode FROM netvalue WHERE fundcode=? AND nvdate=?',
        [fundcode, nvDate], function (err, rows, fields) {
            if(rows.length > 0){

                var params = [
                    netValue,
                    totalNetValue,
                    fundcode,
                    nvDate
                ];

                conn.query('UPDATE netvalue SET netvalue=?, totalnetvalue=? WHERE fundcode=? AND nvdate=?',
                    params, function(err, rows, fields){
                        //nothing
                        conn.end();
                })
            } else {
                var dateTimeString = base.getDateTimeString();
                var params = {
                    fundcode        :fundcode,
                    netvalue        :netValue,
                    totalnetvalue   :totalNetValue,
                    nvdate          :nvDate,
                    addtime         :dateTimeString,
                    updatetime      :dateTimeString
                };

                conn.query('INSERT INTO netvalue SET ?',
                    params, function(err, rows, fields){
                        //nothing
                        conn.end();
                });
            }
        }
    );
}