var GitHub = require('github-api'),
    moment = require('moment'),
    shagit = require('shagit'),
    repo,
    util = require('util');

repo = new GitHub({
    token: process.env.GITHUB_TOKEN,
    auth: 'oauth'
}).getRepo(process.env.USER, process.env.REPO);

function getPath(date, body) {
    date = moment(date);

    return util.format('%s/%s/%s', body, date.getYear(), date.getMonth() + 1);
}

module.exports = {
    read: function(date, body, callback) {
        repo.read('data', getPath(date, body), function(err, content) {
            if (err) {
                if (err === 'not found') {
                    callback(null, null);
                } else {
                    callback(err);
                }
            } else {
                try {
                    callback(null, JSON.parse(content));
                } catch(e) {
                    callback(null, null);
                }
            }
        });
    },
    changed: function(date, body, s, callback) {
        repo.read('data', getPath(date, body), function(err, content, contentSha) {
            var sha;

            if (err) {
                if (err === 'not found') {
                    callback(null, true);
                } else {
                    callback(err);
                }
            } else {
                sha = shagit(s);
                callback(sha === contentSha);
            }
        });
    },
    update: function(date, body, data, callback) {
        var s = JSON.stringify(data);

        module.exports.changed(date, body, s, function(err, changed) {
            if (err) {
                return callback(err);
            }
            module.exports.hasChanged(date, body, changed, callback);
        });
    },
    hasChanged: function(date, body, changed, callback) {
        if (!err && changed) {
            repo.write('data', getPath(date, body), s, "Update.", callback);
        } else {
            callback(err);
        }
    }
};
