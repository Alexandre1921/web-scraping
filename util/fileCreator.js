const fs = require("fs");

module.exports = (path, content, successMessage, options = "utf8") => {
  fs.writeFile(path, content, options, function (err) {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
    }

    console.log(successMessage);
  });
};