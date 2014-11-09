/**
 * Created by ben on 14/11/8.
 */

var express = require('express');
var security = require('./security.js');
var guess = require('../modules/gameGuess.js');
var router = express.Router();
var dotest = true;

router.get('/getLatestTradeDay', function(req, res) {

    var _timestamp = req.param('timestamp');
    var _signkey = req.param('signkey');
    var _params = 'timestamp='+_timestamp;

    if (dotest || security.checkSecurity(_params, _signkey, _timestamp)) {
        res.send(guess.getLatestTradeDay());
    }
    else {
        res.send('error');
    }
});

router.get('/getChipinTradeDay', function(req, res) {

    var _timestamp = req.param('timestamp');
    var _signkey = req.param('signkey');
    var _params = 'timestamp='+_timestamp;

    if (dotest || security.checkSecurity(_params, _signkey, _timestamp)) {
        res.send(guess.getChipinTradeDay());
    }
    else {
        res.send('error');
    }
});

router.get('/getMyInfo', function(req, res) {

    var _timestamp = req.param('timestamp');
    var _deviceid = req.param('deviceid');
    var _signkey = req.param('signkey');
    var _params = 'deviceid=' + _deviceid + '&timestamp=' + _timestamp;

    if (dotest || security.checkSecurity(_params, _signkey, _timestamp)) {
        guess.getMyInfo(_deviceid, res);
    }
    else {
        res.send('error');
    }
});

router.get('/dochipin', function(req, res) {

    var _timestamp = req.param('timestamp');
    var _deviceid = req.param('deviceid');
    var _money = req.param('money');
    var _chipday = req.param('chipday');
    var _chipdirect = req.param('chipdirect');
    var _signkey = req.param('signkey');
    var _params = 'deviceid=' + _deviceid + '&money=' + _money + '&chipday=' + _chipday + '&chipdirect=' + _chipdirect + '&timestamp=' + _timestamp;

    if (dotest || security.checkSecurity(_params, _signkey, _timestamp)) {
        guess.doChipin(_deviceid, _chipday, _money, _chipdirect, res);
    }
    else {
        res.send('error');
    }
});

module.exports = router;