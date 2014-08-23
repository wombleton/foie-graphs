var GitHub = require('github-api'),
    moment = require('moment'),
    shagit = require('shagit'),
    util = require('util');

function Repo(options) {
    var token = options.token,
        user = options.token,
        repoName = options.repoName;

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

Repo.prototype.read = function(options, callback) {
    var path = options.path,
        branch = options.branch;

    branch = branch || 'gh-pages';

    this.repo.read(branch, path, function(err, content) {
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

Repo.prototype.changed = function(options, callback) {
    var path = options.path,
        s = options.s,
        branch = options.branch || 'gh-pages';

    this.repo.read(branch, path, function(err, content, contentSha) {
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

Repo.prototype.update = function(options, callback) {
    var path = options.path,
        s = options.s,
        branch = options.branch || 'gh-pages';

    this.changed(options, function(err, changed) {
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
