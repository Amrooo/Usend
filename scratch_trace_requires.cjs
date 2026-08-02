const Module = require('module');
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  console.log(`Loading: ${request} from ${parent ? parent.filename : 'main'}`);
  try {
    return originalLoad.apply(this, arguments);
  } catch (err) {
    console.error(`Error loading: ${request} - ${err.message}`);
    throw err;
  }
};

console.log("Starting require trace...");
require('firebase-admin');
console.log("Done!");
