const fs = require("fs");

// const cache = {};
const i18n = JSON.parse(fs.readFileSync("./i18n.json").toString());
// const { en, ar, tr } = i18n;

// const myModule = require("../modules/utilities");

exports.serve_main = async (req, res) => {
  res.render("../views/index.html", i18n[req.preferredLanguage]);
};
exports.serve_user_main = async (req, res) => {
  const options = {
    media: req.userInfo.userMediaAndContent.media,
    content: req.userInfo.userMediaAndContent.content[req.preferredLanguage],
    i18n: i18n[req.preferredLanguage],
  };
  // console.log("------options------");
  // console.log(options);
  // console.log("------options------");
  res.render("../views/main.html", options);
};
exports.serve_login = async (req, res) => {
  res.render("../views/login.html", i18n[req.preferredLanguage]);
};
exports.serve_initPage = async (req, res) => {
  res.render("../views/settings.html", i18n[req.preferredLanguage]);
};
exports.serve_dashboard = async (req, res) => {
  res.render("../views/dashboard.html", i18n[req.preferredLanguage]);
};
exports.serve_registpage = async (req, res) => {
  res.render("../views/signup.html", i18n[req.preferredLanguage]);
};
// exports.login = async (req, res) => {
//   console.log("dashboard");
//   try {
//     res.sendFile("C:/Projects/Appointment_booking/views/supplierView.html");
//   } catch (err) {
//     console.log(err);
//   }
// };
