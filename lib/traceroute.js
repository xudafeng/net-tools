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

const chalk = require('chalk');
const childProcess = require('child_process');

const ip = require('./ip');
const _ = require('./helper');

const isWindows = _.platform.isWindows;
const command = isWindows ? 'tracert' : 'traceroute';

const hopParser = function(hop) {
  const data = hop.replace(/\n$/, '').trim();
  const res = data.split(' ');
  if (res.length < 5) {
    return null;
  }
  return {
    host: res[2],
    delta: res[4]
  };
};

module.exports = function main(argv) {
  const host = argv[0];
  const args = isWindows ? ['-d', host] : ['-q', 1, '-n', host];

  const child  = childProcess.spawn(command, args);

  var customQueue = new _.CustomQueue();

  customQueue.next();

  let counter = 0;
  let killCounter = 0;
  child.stdout.on('data', data => {
    const hop = hopParser(data.toString());

    if (hop) {
      customQueue.add(function() {
        var queue = this;
        ip.getInfoByHop(hop, queue);
        counter++;
      });
      killCounter = 0;
    } else {
      killCounter++;
    }

    if (killCounter >= 3) {
      child.kill();
    }
  });

  setTimeout(() => {
    customQueue.next();
  }, 1000);

  process.on('exit', code => {
    console.log(`\n  traceroute finished with: ${chalk.cyan(counter)} hops`);
  });
};
