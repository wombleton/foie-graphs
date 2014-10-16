var Store = require('./lib/store'),
  raw = require('./raw.json'),
  _ = require('underscore'),
  fs = require('fs'),
  store;


store = new Store({
  from: raw.from,
  site: raw.site,
  to: raw.to
});

_.each(raw.db, function(request) {
  store.save(request);
});

fs.writeFile('processed.json', JSON.stringify(store.getOptions()));
