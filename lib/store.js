var async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    Repo = require('./repo');

function Store(user, repoName, token) {
    this.repo = new Repo(user, repoName, token);
    this.cache = {};
}

Store.prototype.save = function(request, callback) {
    var path = this.repo.getPath(request.created_at, request.url_title);

    if (this.cache[path]) {
        this.cache[path][request.url_title] = request.display_status;
    } else {
        this.repo.read(path, function(err, data) {
            this.cache[path] = data || {};
            this.save(request, callback);
        }.bind(this));
    }

    if (this.count++ % 100 === 0) {
        this.persist(callback);
    }
}

Store.prototype.persist = function(callback) {
    var key,
        queue;

    queue = async.queue(this.persistData.bind(this), 1);
    queue.drain = callback;

    for (key in this.cache) {
        queue.push(key);
    }
}

Store.prototype.persistData = function(path, callback) {
    this.repo.update(path, this.cache[path], callback);
};

util.inherits(Store, EventEmitter);

module.exports = Store;

