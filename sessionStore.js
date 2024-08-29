
const {MemoryStore} = require('express-session');
const store = new MemoryStore();


module.exports = store;