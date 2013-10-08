var _ = require('underscore'),
    async = require('async'),
    request = require('request'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

function Scraper(host) {
    this.host = host;
}

util.inherits(Scraper, EventEmitter);

Scraper.prototype.push = function(uri) {
    if (!this.queue) {
        this.queue = async.queue(this.fetch.bind(this), 1);

        this.queue.drain = function() {
            this.emit('finish');
        }.bind(this);
    }

    this.queue.push(uri);
}

Scraper.prototype.fetch = function(uri, callback) {
    request({
        strictSSL: false,
        uri: uri
    }, function(err, response, body) {
        if (err) {
            return callback(err);
        }
        this.store(body, callback);
    }.bind(this));
}

Scraper.prototype.store = function(s, callback) {
    var data = JSON.parse(s);

    this.emit('data', data);

    _.delay(callback, 100); // throttles it a bit
}

module.exports = Scraper;
