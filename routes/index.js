var _ = require('underscore'),
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
