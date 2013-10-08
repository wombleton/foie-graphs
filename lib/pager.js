var Repo = require('./repo');

function Pager(user, repoName, token) {
    this.repo = new Repo(user, repoName, token);
}

Pager.prototype.write = function(store) {
}

module.exports = Pager;
