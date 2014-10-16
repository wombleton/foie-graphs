var fs = require('fs'),
    jade = require('jade'),
    Repo = require('./repo');

function Pager(user, repoName, token) {
    this.repo = new Repo({
        user: user,
        repoName: repoName,
        token: token
    });
}

Pager.prototype.write = function(store) {
    var html,
        options = store.getOptions();

    html = jade.renderFile('templates/index.jade', options);

    fs.writeFile('index.html', html, function(err) {
        if (err) {
            console.log('There was an error writing html: %s', JSON.stringify(err));
        } else {
            console.log('Successfully generated html!');
        }
    });

    /**
    this.repo.update('index.html', html, function(err) {
        if (err) {
            console.log('There was an error updating the repo: %s', JSON.stringify(err));
        } else {
            console.log('Pages successfully updated!');
        }
    });
    */
};

module.exports = Pager;
