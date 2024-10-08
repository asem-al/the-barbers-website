const express = require("express");
const handlers = require("../controllers/RequestsHandlers");
// const users = require("../models/userModel");
const userControllers = require("../controllers/userControllers");
const auth = require("../controllers/authControllers");
const router = express.Router();
const usersRouter = express.Router();
const mainRouter = express.Router();

mainRouter.route("/").get(handlers.serve_main);
mainRouter.route("/signup").get(handlers.serve_registpage);
usersRouter.route("/").get(handlers.serve_user_main);
usersRouter.route("/login").get(handlers.serve_login);
usersRouter.route("/resetpassword/:id").get(handlers.serve_resetPassword);
usersRouter.route("/forgotpassword").get(handlers.serve_sendMeEmail);

usersRouter.route("/settings").get(auth.protect, handlers.serve_initPage);
usersRouter.route("/dashboard").get(auth.protect, handlers.serve_dashboard);

router.use(async (req, res, next) => {
  if (req.username) {
    if (req.userInfo) {
      usersRouter(req, res, next);
    } else {
      res.status(404).end("Not a registered user");
    }
  } else {
    mainRouter(req, res, next);
  }
});

module.exports = router;
