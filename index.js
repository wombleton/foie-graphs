var Search = require('./lib/search'),
    Scraper = require('./lib/scraper'),
    Store = require('./lib/store'),
    Pager = require('./lib/pager'),
    search,
    scraper,
    store,
    count = 0;

search = new Search(process.env.ALAVETELI);
scraper = new Scraper(process.env.ALAVETELI);
store = new Store(process.env.ALAVETELI);

search.on('request', function(uri) {
    scraper.push(uri);
});

scraper.on('data', function(data) {
    console.log("Saving request #%s from %s with the date %s", ++count, data.url_title, data.created_at);
    store.save(data);
});

scraper.on('drain', function() {
    var now = moment(),
        restart = moment().add(7, days);

    new Pager(process.env.USER, process.env.REPO, process.env.TOKEN).write(store);

    _.delay(crawl, restart.valueOf() - now.valueOf());
});

function crawl() {
    search.start(12);
}

crawl();
