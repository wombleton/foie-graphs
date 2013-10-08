var async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    dirty = require('dirty'),
    EventEmitter = require('events').EventEmitter;

function Store() {
    this.db = dirty('tmp');
}

util.inherits(Store, EventEmitter);

Store.prototype.save = function(request, callback) {
    this.db.set(request.url_title) = request;
    callback();
}

module.exports = Store;
