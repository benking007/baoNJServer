/**
 * Created by ben on 14-6-24.
 */
var express = require('express');
var security = require('./security.js');
var netValue = require('../modules/netValues.js');
var router = express.Router();

/* GET users listing. */
router.post('/getfunds', function(req, res) {
    var _timestamp = req.param('timestamp');
    var _params = 'timestamp='+_timestamp;
    var _signkey = req.param('signkey');

    if (security.checkSecurity(_params, _signkey, _timestamp)) {
        netValue.getFunds(res);
    }
    else {
        res.send('error');
    }
});

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

module.exports = router;