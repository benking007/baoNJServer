/**
 * Created by ben on 14-6-23.
 */
var mysql = require('mysql');
var util = require('util');


exports.createConnector = function () {
    var conn = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'yuebao',
        port: 3306
    });
    conn.connect();

    return conn;
};

/*
exports.createConnector = function () {
    var conn = mysql.createConnection({
        host: 'yuebaolocal.mysql.rds.aliyuncs.com',
        user: 'yuebao',
        password: 'benking',
        database: 'yuebao',
        port: 3266
    });
    conn.connect();

    return conn;
};
 */

exports.notNullOrEmpty = function (param) {
    return typeof param != 'undefined' && param != '';
}

exports.getDateString = function () {
    var date = new Date();
    var dateString = util.format('%s-%s-%s',
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate());

    return dateString;
};

exports.getPreDateString = function () {
    var date = new Date();
    var dateString = util.format('%s-%s-%s',
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate() - 1);

    return dateString;
};

exports.getDateTimeString = function () {
    var date = new Date();

    var dateTimeString = util.format('%s-%s-%s %s:%s:%s',
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds());

    return dateTimeString;
}

String.prototype.format = function(args) {
    var result = this;
    if (arguments.length > 0) {
        if (arguments.length == 1 && typeof (args) == "object") {
            for (var key in args) {
                if(args[key]!=undefined){
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
        }
        else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] != undefined) {
                    var reg= new RegExp("({)" + i + "(})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
    }
    return result;
}

Date.prototype.format = function(format){
    var o = {
        "M+" : this.getMonth()+1, //month
        "d+" : this.getDate(), //day
        "h+" : this.getHours(), //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth()+3)/3), //quarter
        "S" : this.getMilliseconds() //millisecond
    }

    if(/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }

    for(var k in o) {
        if(new RegExp("("+ k +")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
        }
    }
    return format;
}


global.__aryCurrFunds = {
    f_000198 : {
        fundcode : '000198',
        netvalue : 1.0000,
        totalnetvalue : 1.0000,
        nvdate : '1900-01-01',
        name : '余额宝',
        fundname : '天弘增利宝'
    },
    f_000464 : {
        fundcode : '000464',
        netvalue : 1.0000,
        totalnetvalue : 1.0000,
        nvdate : '1900-01-01',
        name : '百度-百赚(利滚利)',
        fundname : '嘉实活期宝'
    },
    f_003003 : {
        fundcode : '003003',
        netvalue : 1.0000,
        totalnetvalue : 1.0000,
        nvdate : '1900-01-01',
        name : '百度-百赚',
        fundname : '华夏现金增利A'
    },
    f_000330 : {
        fundcode : '000330',
        netvalue : 1.0000,
        totalnetvalue : 1.0000,
        nvdate : '1900-01-01',
        name : '网易现金宝',
        fundname : '汇添富现金宝'
    },
    f_000343 : {
        fundcode : '000343',
        netvalue : 1.0000,
        totalnetvalue : 1.0000,
        nvdate : '1900-01-01',
        name : '理财通-华夏',
        fundname : '华夏财富宝'
    },
    f_000397 : {
        fundcode : '000397',
        netvalue : 1.0000,
        totalnetvalue : 1.0000,
        nvdate : '1900-01-01',
        name : '理财通-汇添富',
        fundname : '汇添富全额宝'
    },
    f_000575 : {
        fundcode : '000575',
        netvalue : 1.0000,
        totalnetvalue : 1.0000,
        nvdate : '1900-01-01',
        name : '掌柜钱包',
        fundname : '兴全添利货币'
    }
};

global.__aryFunds = [
    {fundcode:'000198', name:'余额宝', fundname:'天弘增利宝'},
    {fundcode:'000464', name:'百度-百赚(利滚利)', fundname:'嘉实活期宝'},
    {fundcode:'003003', name:'百度-百赚', fundname:'华夏现金增利A'},
    {fundcode:'000330', name:'网易现金宝', fundname:'汇添富现金宝'},
    {fundcode:'000343', name:'理财通-华夏', fundname:'华夏财富宝'},
    {fundcode:'000397', name:'理财通-汇添富', fundname:'汇添富全额宝'},
    {fundcode:'000575', name:'掌柜钱包', fundname:'兴全添利货币'}
];

global.__aryCurrStocks = {
    s_sh000300 : {
        stockcode : 'sh000300',
        hqtime : '1900-1-1',
        price : 1,
        priceofyestory : 1,
        priceoftoday : 1,
        priceofhighvalue : 1,
        priceoflowvalue : 1,
        risenum : 1,
        risepercent : 0.1
    }
};

global.__aryDailyIncomeSqlQueue = [];
global.__insertExecuting = false;