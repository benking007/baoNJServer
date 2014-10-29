var express = require('express');
var userservice = require('../modules/user.js');
var router = express.Router();

/* GET users listing. */
router.get('/alluser', function(req, res) {
    userservice.alluser(res);
});

module.exports = router;
