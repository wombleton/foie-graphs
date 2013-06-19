var async = require('async'),
    _s = require('underscore.string'),
    _ = require('underscore'),
    request = require('request'),
    cheerio = require('cheerio'),
    moment = require('moment'),
    url = require('url'),
    requestQueue,
    scrapeQueue,
    limit = moment('2010-02-01'),
    db = require('./db');

scrapeQueue = async.queue(function(date, callback) {
    var start,
        end,
        uri;

    if (_.isString(date)) {
        uri = date;
    } else {
        start = date.startOf('month').format('YYYY-MM-DD');
        end = date.endOf('month').format('YYYY-MM-DD');
        uri = _s.sprintf("%s/list/all?query=&request_date_after=%s&request_date_before=%s&commit=Search", process.env.ALAVETELI, start, end);

        console.log("Date is %s and limit is %s. Adding previous month: %s", date.format('LL'), limit.format('LL'), (date > limit));
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
                console.log("Loading: %s%s", process.env.ALAVETELI, next);
                scrapeQueue.push(process.env.ALAVETELI + next);
            }
            requests = $('.request_listing .head a');

            _.each(requests, function(request) {
                var uri = url.parse($(request).attr('href'));

                delete uri.hash;

                requestQueue.push({
                    uri: process.env.ALAVETELI + url.format(uri) + ".json"
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
            json = _.extend(JSON.parse(body), {
                type: 'info-request'
            });

            db.view('crawler/request', {
                key: json.id,
                limit: 1,
                include_docs: true
            }, function(err, docs) {
                var doc = _.first(docs);

                if (err) {
                    console.log("Error saving json: %s", err);

                    callback(err);
                } else if (!doc) {
                    console.log("Creating document for request at %s", info.uri);

                    db.save(json, callback);
                } else if (doc && body !== JSON.stringify(_.omit(doc, '_id', '_rev', 'type'))) {
                    console.log("Updating request at %s", info.uri);

                    _.extend(doc, json);

                    db.save(doc, callback);
                } else {
                    console.log("No change since last scraped. Carrying on.");

                    callback();
                }
            });
        }
    });
}, 1);

requestQueue.drain = function() {
    // scrape again in 24 hours
    setTimeout(function() {
        scrapeQueue.push(moment());
    }, 1000 * 60 * 60 * 24 * 14);
}

db.save('_design/crawler', require('./design'), function(err) {
    if (process.env.NODE_ENV === 'production') {
        scrapeQueue.push(moment());
    }
});
