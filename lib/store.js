var _ = require('underscore'),
    util = require('util'),
    url = require('url'),
    EventEmitter = require('events').EventEmitter,
    workwork = require('workwork')('nz');

function Store(options) {
    var { site, from, to } = options;

    this.site = site;
    this.from = from;
    this.to = to;
    this.db = {};
}

util.inherits(Store, EventEmitter);

function calculateStatus(key) {
    if (_.contains(['partially_successful', 'successful'], key)) {
        return 'success';
    } else if (key === 'not_held') {
        return 'not_held';
    } else if (key === 'rejected') {
        return 'rejected';
    } else {
        return null;
    }
}

function calculateElapsed(item, status) {
    var start = item.created_at,
        last_describeds = _.compact(_.pluck(item.info_request_events, 'last_described_at')),
        excepts = [
            'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=27,28,29,30,31',
            'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15'
        ],
        end;

    end = _.last(last_describeds);
    if (end && status) {
        return workwork.between(start, end, excepts).length;
    } else {
        return workwork.between(start, new Date(), excepts).length;
    }
}

Store.prototype.save = function(request) {
    this.db[request.url_title] = request;
};

Store.prototype.getRaw = function() {
    return {
        site: this.site,
        from: this.from.toString(),
        to: this.to.toString(),
        db: this.db
    };
};

Store.prototype.getOptions = function() {
    var name = url.parse(this.site).hostname;

    /**
    fs.writeFile('raw.json', JSON.stringify({
        db: this.db,
        site: this.site
    }));
    **/

    return {
        from: this.from,
        to: this.to,
        name: name,
        site: this.site,
        total: this.totalCount(),
        successCount: this.successCount(),
        refusedCount: this.refusedCount(),
        notHeldCount: this.notHeldCount(),
        successful: this.mostSuccessful(),
        refused: this.mostRefused(),
        notHeld: this.mostNotHeld(),
        popular: this.mostRequests(),
        requests: this.byBody()
    };
};

Store.prototype.getRequests = function() {
    var me = this,
        requests = [];

    me.forEach(function(key, item) {
        var status = calculateStatus(item.described_state),
            elapsed = calculateElapsed(item, status);

        requests.push({
            title: item.title,
            url: me.site + '/request/' + item.url_title,
            status: status,
            elapsed_time: elapsed,
            body: item.public_body.name,
            body_url: me.site + '/bodies/' + item.public_body.url_name
        });
    });

    return requests;
};

Store.prototype.totalCount = function() {
    var count = 0;

    this.forEach(function(key, item) {
        if (item) {
            count++;
        }
    });
    return count;
};

Store.prototype.successCount = function() {
    var count = 0;

    this.forEach(function(key, item) {
        if (item && _.contains(['partially_successful', 'successful'], item.described_state)) {
            count++;
        }
    });
    return count;
};

Store.prototype.notHeldCount = function() {
    var count = 0;
    this.forEach(function(key, item) {
        if (item && item.described_state === 'not_held') {
            count++;
        }
    });
    return count;
};

Store.prototype.refusedCount = function() {
    var count = 0;
    this.forEach(function(key, item) {
        if (item && item.described_state === 'rejected') {
            count++;
        }
    });
    return count;
};

Store.prototype.clear = function() {
    this.db = {};
};

Store.prototype.forEach = function(iterator) {
    _.each(this.db, function(value, key) {
        iterator(key, value);
    });
};

Store.prototype.mostRate = function(states) {
    var bodies = [];

    this.forEach(function(key, item) {
        var body;

        if (!item) {
            return;
        }

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
        var rate = (b.rate / b.count) - (a.rate / a.count);

        if (rate !== 0) {
            return rate;
        } else {
            return b.rate - a.rate;
        }
    });

    return _.first(bodies, 3);
};

Store.prototype.mostSuccessful = function() {
    return this.mostRate(['partially_successful', 'successful']);
};

Store.prototype.mostRefused = function() {
    return this.mostRate(['rejected']);
};

Store.prototype.mostNotHeld = function() {
    return this.mostRate(['not_held']);
};

Store.prototype.mostRequests = function() {
    var bodies = [];

    this.forEach(function(key, item) {
        var body;

        if (!item) {
            return;
        }

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
};

module.exports = Store;
