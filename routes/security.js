/**
 * Created by ben on 14-7-21.
 */
var crypto = require('crypto');
var cache = require("./sample-cache/Cache.js");
global._cache = cache.createCache("LRU", 100 * 100 * 10);
global._cryptoKey = 'AC2ACDAD&^32EABA14EB';

exports.checkSecurity = function (params, signKey, timeStamp) {
    //return true;
    params += global._cryptoKey;
    var serverSignKey = md5(params);
    var timeStampFromCache = global._cache.get(timeStamp);
    if (timeStampFromCache) {
        return false;
    }

    if(serverSignKey == signKey) {
        global._cache.set(timeStamp, timeStamp, 1000 * 60 * 5);
        return true;
    }

    return false;
}

function md5(data){
    var _md5 = crypto.createHash('md5');
    return _md5.update(data).digest('hex').toUpperCase();
}