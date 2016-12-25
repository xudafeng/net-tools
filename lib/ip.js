/* ================================================================
 * net-tools by xdf(xudafeng[at]126.com)
 *
 * first created at : Sat Dec 24 2016 16:40:36 GMT+0800 (CST)
 *
 * ================================================================
 * Copyright  xdf
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */

'use strict';

const dns = require('dns');
const chalk = require('chalk');
const request = require('request');

const _ = require('./helper');
const UA = require('./common').UA;

/*
https://api.ip2country.info/ip?127.0.0.1
https://dazzlepod.com/ip/127.0.0.1.json
https://www.ipify.org/
http://freeapi.ipip.net/127.0.0.1
*/

/*
dns.lookup('www.github.com', (err, address) => {
  //console.log(address);
});

dns.resolve('www.github.com', (err, address) => {
  address.forEach(item => {
    console.log(item);
  });
});
*/

//class A : 1-126   : 8 netmask
//class B : 128-191 : 16 netmask
//class C : 192-223 : 24 netmask
//class D : 224-239 : 32 netmask

exports.ipClass = ip => {
  var pre = parseInt(ip.split('.')[0], 10);
  if (pre >= 1 && pre <= 126) {
    return 'A';
  } else if (pre >= 128 && pre <= 191) {
    return 'B';
  } else if (pre >= 192 && pre <= 223) {
    return 'C';
  } else if (pre >= 224 && pre <= 239) {
    return 'D';
  }
};

var retryRequest = (options, successCallback) => {
  request(options, (error, response, body) => {
    if (error) {
      return console.log(error);
    }
    if (response.statusCode === 200) {
      successCallback(body);
    } else {
      retryRequest(options, successCallback);
    }
  });
};

var colorFulPrinter = (hop, body) => {
  var ip = hop.host + new Array(16 - hop.host.length).join(' ');
  var time = new Array(10 - hop.delta.length).join(' ') + hop.delta.slice(0, 7);
  var locale = JSON.parse(body).join('');
  var delta = parseInt(hop.delta, 10);
  var color = 'yellow';

  if (delta <= 20) {
    color = 'green';
  } else if (delta >= 200) {
    color = 'red';
  }
  console.log(chalk[color](` [${exports.ipClass(ip)}] ${ip} ${time} ms ${locale}`));
};

exports.getInfoByHop = (hop, queue) => {
  retryRequest({
    url: `http://freeapi.ipip.net/${hop.host}`,
    headers: {
      'User-Agent': UA
    }
  }, body => {
    colorFulPrinter(hop, body);
    queue.next();
  });
};
