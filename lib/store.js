var _ = require('underscore'),
    util = require('util'),
    dirty = require('dirty'),
    url = require('url'),
    EventEmitter = require('events').EventEmitter;

function Store(site) {
    this.site = site;
    this.db = dirty('tmp.db');
    this.db.on('load', function() {
        this.emit('load');
    }.bind(this));
}

util.inherits(Store, EventEmitter);

Store.prototype.save = function(request) {
    this.db.set(request.url_title, request);
}

Store.prototype.getOptions = function() {
    debugger;
    name = url.parse(this.site).hostname;
    return {
        name: name,
        site: this.site,
        total: this.totalCount(),
        successCount: this.successCount(),
        refusedCount: this.refusedCount(),
        notHeldCount: this.notHeldCount(),
        successful: this.mostSuccessful(),
        refused: this.mostRefused(),
        notHeld: this.mostNotHeld(),
        requests: this.mostRequests()
    };
};

Store.prototype.totalCount = function() {
    var count = 0;
    this.db.forEach(function() {
        count++;
    });
    return count;
}

Store.prototype.successCount = function() {
    var count = 0;
    this.db.forEach(function(key, item) {
        if (_.contains(['partially_successful', 'successful'], item.described_state)) {
            count++;
        }
    });
    return count;
}

Store.prototype.notHeldCount = function() {
    var count = 0;
    this.db.forEach(function(key, item) {
        if (item.described_state === 'not_held') {
            count++;
        }
    });
    return count;
}

Store.prototype.refusedCount = function() {
    var count = 0;
    this.db.forEach(function(key, item) {
        if (item.described_state === 'rejected') {
            count++;
        }
    });
    return count;
}

Store.prototype.mostRate = function(states) {
    var bodies = [];

    this.db.forEach(function(key, item) {
        var body;

        body = _.findWhere(bodies, {
            url: item.public_body.url_name
        });

        if (!body) {
            body = {
                count: 0,
                rate: 0,
                name: item.public_body.name,
                url: item.public_body.url_name
            };
            bodies.push(body);
        }

        body.count++;

        if (_.contains(states, item.described_state)) {
            body.rate++;
        }
    });

    // remove all bodies with less than three requests
    bodies = _.reject(bodies, function(body) {
        return body.count < 3;
    });

    bodies.sort(function(a, b) {
        return (b.rate / b.count) - (a.rate / a.count);
    });

    return _.first(bodies, 3);
}

Store.prototype.mostSuccessful = function() {
    return this.mostRate(['partially_successful', 'successful']);
}

Store.prototype.mostRefused = function() {
    return this.mostRate(['rejected']);
}

Store.prototype.mostNotHeld = function() {
    return this.mostRate(['not_held']);
}

Store.prototype.mostRequests = function() {
    var bodies = [];

    this.db.forEach(function(key, item) {
        var body;

        body = _.findWhere(bodies, {
            url: item.public_body.url_name
        });

        if (!body) {
            body = {
                count: 0,
                name: item.public_body.name,
                url: item.public_body.url_name
            };
            bodies.push(body);
        }

        body.count++;
    });

    bodies.sort(function(a, b) {
        return b.count - a.count;
    });

    return _.first(bodies, 3);
}

Store.prototype.mostRefused = Store.prototype.mostNotHeld = Store.prototype.mostRequests = Store.prototype.mostSuccessful;

module.exports = Store;
