var cradle = require('cradle'),
    _ = require('underscore'),
    conn,
    db;

conn = new (cradle.Connection)('http://localhost', 5984, {
    auth: {
        username: 'admin',
        password: 'admin'
    }
});
db = conn.database('fyi-graphs');

/*
 * GET home page.
 */

exports.data = function(req, res) {
    var year = req.params.year,
        startkey = [],
        endkey = [{}];

    if (year) {
        startkey.push(Number(year));
        endkey.push(Number(year));
    }

    db.view('crawler/list', {
        include_docs: true,
        startkey: startkey,
        endkey: endkey
    }, function(err, results) {
        var stats = [
            {
                key: "Successful",
                color: "#1f77b4",
                values: []
            },
            {
                key: "Unsuccessful",
                color: "#d62728",
                values: []
            },
            {
                key: "Not Held",
                color: "#888",
                values: []
            },
            {
                key: "Waiting",
                color: "#7ab",
                values: []
            }
        ];

        stats = _.reduce(results, function(memo, result) {
            var doc = result.doc,
                events = doc.info_request_events,
                title = result.key[1],
                status = doc.described_state,
                series,
                body;

            if (_.contains('waiting_response waiting_clarification internal_review'.split(' '), status)) {
                series = memo[3];
            } else if (_.contains('rejected'.split(' '), status)) {
                series = memo[1];
            } else if (_.contains('partially_successful successful'.split(' '), status)) {
                series = memo[0];
            } else if (_.contains('not_held'.split(' '), status)) {
                series = memo[2];
            } else if (_.contains('user_withdrawn'.split(' '), status)) {
                // do nothing
            } else {
                debugger;
            }

            if (!series) {
                return memo;
            }
            body = _.findWhere(series.values, {
                label: title
            });

            if (!body) {
                _.each(memo, function(series) {
                    series.values.push({
                        label: title,
                        value: 0
                    });
                });
                body = _.findWhere(series.values, {
                    label: title
                });
            }

            body.value++;

            return memo;
        }, stats);

        stats.lines = _.max(_.map(stats, function(series) {
            return series.values.length;
        }));

        res.send(stats);
    });
}

exports.index = function(req, res) {
    res.render('index', {});
};
