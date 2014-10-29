/**
 * Created by ben on 14-6-23.
 */

var base = require('./baseUtil.js');

exports.alluser = function (res) {
    var mysql = require('mysql');
    var conn = base.createConnector();

    conn.query('select * from deviceuser', function (err, rows, fields) {
        res.send(rows);
    });

    conn.end();
};
