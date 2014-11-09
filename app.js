var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//新增加 @2014-07-21
var lusca = require('lusca');
var compression = require('compression');
var cookieSession = require('cookie-session')

var routes = require('./routes/index');
var users = require('./routes/users');
var myFunds = require('./routes/myFunds');
var netValues = require('./routes/netValues');
var guess = require('./routes/gameGuess');
var mod_netValues = require('./modules/netValues');
var mod_myFunds = require('./modules/myFunds');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//启用压缩
app.use(compression());

//增加session支持
app.use(cookieSession({
    keys: ['baobao_s1', 'baobao_s2']
}))


//防止csrf攻击
//app.use(lusca({
//    csrf: true,
//    csp: { /* ... */},
//    xframe: 'SAMEORIGIN',
//    p3p: 'ABCDEF',
//    hsts: {maxAge: 31536000, includeSubDomains: true},
//    xssProtection: true
//}));

app.use('/', routes);
app.use('/users', users);
app.use('/myfunds', myFunds);
app.use('/netvalues', netValues);
app.use('/guess', guess);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: {}
    });
});

//抓取基金净值片段代码
function spiderNetValue(){
    mod_netValues.spiderNetValue();
    console.log('spider once');
}

//插入日收益数据
function executeDailyIncomeSql(){
    mod_myFunds.executeDailyIncomeSql();
    console.log('exe sql once');
}

//先跑一次
process.nextTick(spiderNetValue);

//以后5分钟跑一次
setInterval(spiderNetValue, 1000 * 60 * 5);
setInterval(executeDailyIncomeSql, 1000 * 60 * 5);

module.exports = app;