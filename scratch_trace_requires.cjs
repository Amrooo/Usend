const Module = require('module');
const originalRequire = Module.prototype.require;
let depth = 0;
Module.prototype.require = function(path) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}> [IN] ${path}`);
  depth++;
  try {
    const res = originalRequire.apply(this, arguments);
    depth--;
    console.log(`${indent}< [OUT] ${path}`);
    return res;
  } catch (e) {
    depth--;
    console.log(`${indent}< [ERR] ${path}: ${e.message}`);
    throw e;
  }
};
require('firebase-admin');
