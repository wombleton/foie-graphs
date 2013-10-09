var GitHub = require('github-api'),
    moment = require('moment'),
    shagit = require('shagit'),
    util = require('util');

function Repo(user, repoName, token) {
    this.repo = new GitHub({
        token: token,
        auth: 'oauth'
    }).getRepo(user, repoName);
}

module.exports = Repo;

Repo.prototype.getPath = function(date, body) {
    date = moment(date);

    return util.format('%s/%s', date.year(), body);
};

Repo.prototype.read = function(path, callback) {
    this.repo.read('gh-pages', path, function(err, content) {
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
};

Repo.prototype.changed = function(path, s, callback) {
    this.repo.read('gh-pages', path, function(err, content, contentSha) {
        var sha;

        if (err) {
            if (err === 'not found') {
                callback(null, true);
            } else {
                callback(err);
            }
        } else {
            sha = shagit(s);
            callback(null, sha !== contentSha);
        }
    });
};

Repo.prototype.update = function(path, s, callback) {
    this.changed(path, s, function(err, changed) {
        if (err) {
            return callback(err);
        }
        if (changed) {
            this.repo.write('gh-pages', path, s, 'Update for ' + moment().format('LL'), callback);
        } else {
            callback();
        }
    }.bind(this));
};
