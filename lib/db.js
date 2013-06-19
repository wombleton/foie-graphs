var conn,
    cradle = require('cradle');

conn = new (cradle.Connection)({
    host: process.env.COUCH_HOST,
    port: process.env.COUCH_PORT,
    auth: {
        username: process.env.COUCH_USER,
        password: process.env.COUCH_PASS
    }
});

module.exports = conn.database(process.env.COUCH_DB);
