var Search = require('./lib/search'),
    Scraper = require('./lib/scraper'),
    Store = require('./lib/store'),
    Pager = require('./lib/pager'),
    Repo = require('./lib/repo'),
    fs = require('fs'),
    _ = require('underscore'),
    moment = require('moment'),
    search,
    scraper,
    store,
    end = moment(),
    start = end.clone().subtract(12, 'months').startOf('month'),
    count = 0;

search = new Search(process.env.ALAVETELI);
scraper = new Scraper(process.env.ALAVETELI);
store = new Store({
    from: start,
    site: process.env.ALAVETELI,
    to: end
});

search.on('request', function(uri, original) {
    console.log("URI %s linked to from %s", uri, original);
    scraper.push(uri);
});

scraper.on('data', function(data) {
    if (moment(data.created_at) > start) {
        store.save(data);
    }
});

scraper.on('finish', function() {
    var raw = JSON.stringify(store.getRaw());

    fs.writeFile('raw.json', raw);
    /*
    new Repo({
        user: process.env.USER,
        repoName: process.env.REPO,
        token: process.env.TOKEN
    }).update({
        branch: 'master',
        path: 'raw.json',
        s: raw
    }, function(err) {
        if (err) {
            console.log("Error committing file: %s", JSON.stringify(err));
        } else {
            console.log("Successfully updated raw.json");
        }
    });
    */
});

function crawl() {
    store.clear();
    search.start(12);
}

crawl();
