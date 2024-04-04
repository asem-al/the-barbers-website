const fs = require("fs");

function ViewEngine(filePath, options, callback) {
  try {
    fs.readFile(filePath, "utf8", (err, content) => {
      if (err) return callback(err);

      const rendered = content.replace(/%%(.*?)%%/g, (match, key) => {
        const kays = key.trim().split(".");
        let x = options;

        for (let i = 0; i < kays.length; i++) {
          if (x) {
            x = x[kays[i]];
          }
        }
        return x;
      });

      return callback(null, rendered);
    });
  } catch (err) {
    console.log(err);
  }
}

module.exports = ViewEngine;
