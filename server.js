const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: __dirname + "/config.env" });

const DB = process.env.DATABASE.replace("<password>", process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB, {})
  .then((con) => {
    console.log("Connected to DB.");
  })
  .catch((err) => {
    console.log(err);
    console.log("Faild to connect to DB.");
  });

const app = require("./app");

app.listen(process.env.PORT || 8000, () => {
  console.log("Listening ...");
});
