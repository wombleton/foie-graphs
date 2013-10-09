var _ = require('underscore'),
    async = require('async'),
    moment = require('moment'),
    cheerio = require('cheerio'),
    request = require('request'),
    url = require('url'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

function Search(host) {
    this.host = host;
}

util.inherits(Search, EventEmitter);

Search.prototype.checkMonth = function(offset) {
    var date = moment().subtract(offset, 'months'),
        start = this.formatDate(date.startOf('month')),
        end = this.formatDate(date.endOf('month')),
        uri;

    uri = util.format("%s/list/all?query=&request_date_after=%s&request_date_before=%s&commit=Search", this.host, start, end);
    //console.log("Requesting a search for %s to %s", start, end);

    this.queue.push(uri);
};

Search.prototype.formatDate = function(date) {
    return date.format('YYYY-MM-DD');
};

Search.prototype.parseBody = function(body, originalURI, callback) {
    var $ = cheerio.load(body),
        next = $('.pagination .next_page').attr('href'),
        requests;

    if (next) {
        this.queue.push(this.host + next);
    }
    requests = $('.request_listing .head a');

    _.each(requests, function(request) {
        var uri = url.parse($(request).attr('href'));

        delete uri.hash;

        this.emit('request', util.format('%s%s.json', this.host, url.format(uri)), originalURI);
    }, this);

    callback();
};

Search.prototype.requestURI = function(uri, callback) {
    request({
        strictSSL: false,
        uri: uri
    }, function(err, response, body) {
        if (err) {
            return callback(err);
        }
        this.parseBody(body, uri, callback);
    }.bind(this));
};

Search.prototype.start = function(months) {
    this.queue = async.queue(this.requestURI.bind(this), 1);

    while (months >= 0) {
        this.checkMonth(months--);
    }
}

module.exports = Search;
