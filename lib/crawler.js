var Search = require('./search'),
    Scraper = require('./scraper'),
    Store = require('./store'),
    util = require('util');

search = new Search(process.env.ALAVETELI);
scraper = new Scraper(process.env.ALAVETELI);

search.on('request', function(uri) {
    scraper.push(uri);
});

scraper.on('data', function(data) {
    console.log(data);
});

scraper.on('drain', function() {
    var now = moment(),
        restart = moment().add(7, days);

    _.delay(crawl, restart.valueOf() - now.valueOf());
});

function crawl() {
    search.start(30);
}

crawl();
