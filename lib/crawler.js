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
    db = require('./db'),
    cache = require('./cache');

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
        strictSSL: false,
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
        strictSSL: false,
        uri: info.uri
    }, function(err, response, body) {
        var json;

        if (err) {
            console.log("Error making request...");
            callback(err);
        } else {
            json = _.extend(JSON.parse(body), {
                type: 'info-request'
            });

            db.view('crawler/request', {
                key: json.id,
                limit: 1,
                include_docs: true
            }, function(err, results) {
                var result = _.first(results),
                    doc = result && result.doc;

                if (err) {
                    console.log("Error saving json: %s", err);

                    callback(err);
                } else if (!doc) {
                    console.log("Creating document for request at %s", info.uri);

                    db.save(json, callback);
                    cache.clearCache();
                } else if (doc && body !== JSON.stringify(_.omit(doc, '_id', '_rev', 'type'))) {
                    console.log("Updating request at %s", info.uri);

                    _.extend(doc, json);

                    db.save(doc, callback);
                    cache.clearCache();
                } else {
                    console.log("No change since last scraped %s", info.uri);

                    callback();
                }
            });
        }
    });
}, 1);

requestQueue.drain = function() {
    // scrape again in two weeks
    console.log("Done, crawling again in one week.");
    setTimeout(function() {
        startCrawling();
    }, moment.duration(1, 'week').asMilliseconds());
}

function startCrawling() {
    if (true) {
    //if (process.env.NODE_ENV === 'production') {
        db.get('last-scrape', function(err, doc) {
            var startIn;

            if (err && err.error === 'not_found') {
                // fake last scrape as being two days ago
                db.save('last-scrape', {
                    startedAt: moment().subtract(2, 'days').add(30, 'seconds').valueOf()
                }, function(err) {
                    if (!err) {
                        startCrawling();
                    }
                });
            } else if (doc) {
                startIn = moment(doc.startedAt).add(2, 'days').diff(moment());

                if (startIn < 30000) {
                    startIn = 30000;
                }

                setTimeout(function() {
                    var m = moment();

                    db.merge('last-scrape', {
                        startedAt: m.valueOf()
                    }, function() {
                        scrapeQueue.push(m);
                    });
                }, startIn);
            } else {
                console.log("Can't find scrape starting point; can't start scraping.");
            }
        });
    }
}

db.get('_design/crawler', function(err, doc) {
    var design = require('./design');

    if (!err || err.error === 'not_found') {
        if (matchViews(design.views, doc && doc.views)) {
            startCrawling();
        } else {
            console.log("Designs don't match. Updating.");
            db.save('_design/crawler', design, function(err) {
                if (err) {
                    console.log("Error updating design: %s", err);
                } else {
                    startCrawling();
                }
            });
        }
    }
});

function matchViews(a, b) {
    var keys = _.keys(a);

    return _.all(keys, function(key) {
        return b && b[key] && b[key].map && a[key] && a[key].map && a[key].map.toString() === b[key].map.toString();
    });
}
