/**
 * Created by ben on 14-6-23.
 */
var express = require('express');
var security = require('./security.js');
var myFund = require('../modules/myFunds.js');
var router = express.Router();

/* GET users listing. */
router.post('/getmyfund', function(req, res) {
    var _deviceid = req.param('deviceid');
    var _fundcode = req.param('fundcode');
    var _timestamp = req.param('timestamp');
    var _signkey = req.param('signkey');
    var _params = 'deviceid='+_deviceid+'&fundcode='+_fundcode+'&timestamp='+_timestamp;

    if (security.checkSecurity(_params, _signkey, _timestamp)) {
        myFund.getMyFund(
            _deviceid,
            _fundcode,
            res, req.param('view'));
    }
    else {
        res.send('error');
    }
});

router.post('/setmyfund', function(req, res){
    var _deviceid = req.param('deviceid');
    var _fundcode = req.param('fundcode');
    var _quotient = req.param('quotient');
    var _totalincome = req.param('totalincome');
    var _timestamp = req.param('timestamp');
    var _signkey = req.param('signkey');
    var _params = 'deviceid='+_deviceid+'&fundcode='+_fundcode+'&quotient='+_quotient
        +'&totalincome='+_totalincome+'&timestamp='+_timestamp;

    if (security.checkSecurity(_params, _signkey, _timestamp)) {
        myFund.setMyFund(
            req.param('deviceid'),
            req.param('fundcode'),
            req.param('quotient'),
            req.param('totalincome'),
            res);
    }
    else {
        res.send('error');
    }
});

router.get('/getdailysql', function(req,res){
   res.send(global.__aryDailyIncomeSqlQueue);
});

module.exports = router;