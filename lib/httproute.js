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

const http = require('http');
const https = require('https');
const chalk = require('chalk');
const parseUrl = require('url').parse;
const normalizeUrl = require('normalize-url');
const childProcess = require('child_process');

const ip = require('./ip');
const _ = require('./helper');
const UA = require('./common').UA;

module.exports = function main(argv) {
  var hops = 0;

  const loop = (url, ms) => {
    url = normalizeUrl(url, {
      stripWWW: false
    });

    var options = parseUrl(url);
    options.method = 'HEAD';
    options.headers = {
      'User-Agent': UA
    };

    const protocol = options.protocol === 'https:' ? https : http;

    const req = protocol.request(options, res => {
      _.setProtocol(res);

      const protocol = chalk.white(`${res.protocol}/${res.httpVersionMajor}.${res.httpVersionMinor}`);
      const code = chalk.green(`[${res.statusCode}]`);
      var color = 'yellow';
      if (+new Date - ms <= 200) {
        color = 'green';
      } else if (+new Date - ms >= 1000) {
        color = 'red';
      }
      const delta = chalk[color](`(${+new Date - ms})ms`);
      console.log(`  ${protocol} ${code} ${chalk.magenta(url)} ${delta}`);

      switch (res.statusCode) {
        case 301:
        case 302:
        case 303:
        case 307:
          hops++;
          loop(res.headers.location, +new Date);
          break;
        default:
          console.log(`\n  http trace finished with: ${chalk.cyan(hops)} hops`);
          process.exit(0);
      }
    });

    req.on('error', err => {
      console.error('Error:', err.message);
      process.exit(1);
    });

    req.end();
  };

  loop(argv[0], +new Date);
};
