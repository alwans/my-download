const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(proxy('/upload/ipa', { target: 'http://192.168.131.184:7090'}));
};