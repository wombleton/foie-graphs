var _ = require('underscore'),
    db = require('../lib/db'),
    cache = require('../lib/cache'),
    url = require('url');

/*
 * GET home page.
 */

exports.data = function(req, res) {
    var year = req.query.year;

    cache.forYear(year || 'all', function(err, stats) {
        if (err) {
            res.send(500, 'Database problem.');
        } else {
            res.send(stats);
        }
    });
}

exports.index = function(req, res) {
    cache.getYears(function(err, years) {
        res.render('index', {
            law: process.env.ALAVETELI_LAW || "OIA",
            host: url.parse(process.env.ALAVETELI).host,
            years: years
        });
    });
};

exports.links = function(req, res) {
    var year = Number(req.params.year),
        label = req.params.label,
        status = req.params.status;

    db.view('crawler/list', {
        include_docs: true,
        startkey: [year, label, status],
        endkey: [year, label, status]
    }, function(err, results) {
        if (err) {
            res.send(500, "Can't access database.");
        } else {
            res.render('links', {
                site: process.env.ALAVETELI,
                label: label,
                status: status,
                year: year,
                links: _.pluck(results, 'doc')
            });
        }
    });
};
