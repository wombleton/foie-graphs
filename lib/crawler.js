var async = require('async'),
    cradle = require('cradle'),
    _s = require('underscore.string'),
    _ = require('underscore'),
    request = require('request'),
    cheerio = require('cheerio'),
    moment = require('moment'),
    url = require('url'),
    requestQueue,
    scrapeQueue,
    limit = moment('2010-02-01'),
    conn,
    db;

conn = new (cradle.Connection)('http://localhost', 5984, {
    auth: {
        username: 'admin',
        password: 'admin'
    }
});
db = conn.database('fyi-graphs');

scrapeQueue = async.queue(function(date, callback) {
    var start,
        end,
        uri;

    if (_.isString(date)) {
        uri = date;
    } else {
        start = date.startOf('month').format('YYYY-MM-DD');
        end = date.endOf('month').format('YYYY-MM-DD');
        uri = _s.sprintf("https://fyi.org.nz/list/all?query=&request_date_after=%s&request_date_before=%s&commit=Search", start, end);

        console.log("Date is %s and limit is %s. Adding previous month: %s", date, limit, (date > limit));
        if (date > limit) {
            scrapeQueue.push(date.subtract('months', 1));
        }
    }
    request({
        uri: uri
    }, function(err, response, body) {
        var $,
            next,
            requests;

        if (err) {
            console.log(err);
            process.exit(1);
        } else {
            $ = cheerio.load(body);

            next = $('.pagination .next_page').attr('href');

            if (next) {
                console.log("Loading: https://fyi.org.nz" + next);
                scrapeQueue.push("https://fyi.org.nz" + next);
            }
            requests = $('.request_listing .head a');

            _.each(requests, function(request) {
                var uri = url.parse($(request).attr('href'));

                delete uri.hash;

                requestQueue.push({
                    uri: "https://fyi.org.nz" + url.format(uri) + ".json"
                });
            });
            callback();
        }
    });
}, 1);

requestQueue = async.queue(function(info, callback) {
    request({
        uri: info.uri
    }, function(err, response, body) {
        var json;

        if (err) {
            callback(err);
        } else {
            console.log("Saving json for request at %s", info.uri);

            json = _.extend(JSON.parse(body), {
                type: 'info-request'
            });

            db.view('crawler/request', {
                key: json.id,
                limit: 1,
                include_docs: true
            }, function(err, result) {
                var doc = _.result(_.first(result.rows), 'doc');

                if (err) {
                    callback(err);
                } else if (body !== JSON.stringify(_.omit(doc, '_id', '_rev', 'type'))) {
                    db.save(json, callback);
                } else {
                    callback();
                }
            });
        }
    });
}, 1);

db.save('_design/crawler', require('./design'), function(err) {
    scrapeQueue.push(moment());
});
