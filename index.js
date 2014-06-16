var jsdom = require('jsdom'),
  request = require('request'),
  url = require('url'),
  npm = require("npm"),
  redis = require("redis");

var client = redis.createClient();

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

function crawled(module) {
  client.sadd("crawled", module, function (err, idd) {
    if (idd == 1) {
      npm.commands.view([module], true, function (er, data2) {
        if (data2 != undefined) {
          var mm = data2[Object.keys(data2)[0]];
          if (mm != undefined) {
            var deps = mm.dependencies;
            var module = mm.name;
            if (deps != undefined && Object.keys(deps).length > 0) {
              for(var i = 0; i < Object.keys(deps).length; i++) {
                var lib = Object.keys(deps)[i];
                console.log(lib + " <- " + module);
                client.sadd(lib, module);
              }
            }
          }
        }
      });
    }
  });
}