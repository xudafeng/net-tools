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

const util = require('xutil');
const childProcess = require('child_process');

var _ = util.merge({}, util);

_.exec = function(cmd, opts) {
  return new Promise(function(resolve, reject) {
    childProcess.exec(cmd, _.merge({
      maxBuffer: 1024 * 512,
      wrapArgs: false
    }, opts || {}), function(err, stdout) {
      if (err) {
        return reject(err);
      }
      resolve(_.trim(stdout));
    });
  });
};

_.sleep = function(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

_.retry = function(func, interval, num) {
  return new Promise((resolve, reject) => {
    func().then(resolve, err => {
      if (num > 0 || typeof num === 'undefined') {
        _.sleep(interval).then(() => {
          resolve(_.retry(func, interval, num - 1));
        });
      } else {
        reject(err);
      }
    });
  });
};

_.waitForCondition = function(func, wait/*ms*/, interval/*ms*/) {
  wait = wait || 5000;
  interval = interval || 500;
  let start = Date.now();
  let end = start + wait;
  const fn = function() {
    return new Promise(function(resolve, reject) {
      const continuation = (res, rej) => {
        let now = Date.now();
        if (now < end) {
          res(_.sleep(interval).then(fn));
        } else {
          rej(`Wait For Condition timeout ${wait}`);
        }
      };
      func().then(isOk => {
        if (!!isOk) {
          resolve();
        } else {
          continuation(resolve, reject);
        }
      }).catch(e => {
        continuation(resolve, reject);
      });
    });
  };
  return fn();
};

_.spawn = function() {
  var args = Array.prototype.slice.call(arguments);

  return new Promise((resolve, reject) => {
    var stdout = '';
    var stderr = '';
    var child = childProcess.spawn.apply(childProcess, args);

    child.on('error', error => {
      reject(error);
    });

    child.stdout.on('data', data => {
      stdout += data;
    });

    child.stderr.on('data', data => {
      stderr += data;
    });

    child.on('close', code => {
      var error;
      if (code) {
        error = new Error(stderr);
        error.code = code;
        return reject(error);
      }
      resolve([stdout, stderr]);
    });
  });
};

var Defer = function() {
  this._resolve = null;
  this._reject = null;
  this.promise = new Promise((resolve, reject) => {
    this._resolve = resolve;
    this._reject = reject;
  });
};

Defer.prototype.resolve = function(data) {
  this._resolve(data);
};

Defer.prototype.reject = function(err) {
  this._reject(err);
};

_.Defer = Defer;

function CustomQueue() {
  this.queue = [];
}

CustomQueue.prototype.add = function(handle) {
  this.queue.push(handle.bind(this));
};

CustomQueue.prototype.next = function() {
  var current = this.queue.shift();

  setTimeout(() => {
    current && current();
  }, 1000);
};

_.CustomQueue = CustomQueue;

_.setProtocol = res => {
  res.protocol = 'HTTP';
  if (res.socket._spdyState) {
    var spdyState = res.socket._spdyState.parent;
    var protocol = spdyState.alpnProtocol || spdyState.npnProtocol;
    var parts = protocol.match(/^([^\/\d]+)\/?(\d+)(?:\.(\d+))?/i);
    if (parts) {
      res.protocol = parts[1] === 'h' ? 'HTTP' : parts[1].toUpperCase();
      res.httpVersionMajor = parts[2];
      res.httpVersionMinor = parts[3] || 0;
      res.httpVersion = `${res.httpVersionMajor}.${res.httpVersionMinor}`;
    }
  }
};

module.exports = _;
