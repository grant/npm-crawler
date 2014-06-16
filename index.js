var jsdom = require('jsdom'),
  request = require('request'),
  url = require('url'),
  npm = require("npm");

var configObject = {
  "dev": false,
  "loglevel": "error"
};

getData(0);

function getData(j) {
  request({
    uri: 'https://npmjs.org/browse/all/' + j
  }, function (err, response, body) {

    if (err && response.statusCode !== 200) {
      console.log('Request error.');
    }

    npm.load(configObject, function (er, npm) {
      jsdom.env({
        html: body,
        scripts: ['http://code.jquery.com/jquery-1.6.min.js'],
        done: function (err, window) {
          var $ = window.jQuery;
          var $rows = $('body').find('.row');

          if ($rows.length > 1) {
            $rows.each(function (i, item) {
              var $a = $(item).find('a');
              var module = $a.html();

              crawled(module);
            });
            getData(j + 1);
          }
        }
      });
    });
  });
}

var modules = [];
var i = 0;
var fs = require('fs');

function crawled(module) {
  modules.push(module);
  if (i % 100 === 0) {
    fs.writeFile("modules.txt", modules, function(err) {
      console.log('saved!');
    });
  }
  ++i;
}