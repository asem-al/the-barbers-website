const express = require("express");
const userControllers = require("./../controllers/userControllers");
const authControllers = require("./../controllers/authControllers");
const router = express.Router();

/// Param Midlleware
// router.param("id", (req, res, next, val) => {
//     console.log(`id is: ${val}.`);
//next();
// });

// router.route("/").get();

router
  .route("/")
  .get(authControllers.protect, userControllers.getUserInfo)
  .post(authControllers.protect, userControllers.EditUserInfo)
  .delete(authControllers.protect, userControllers.deleteUser);
router.route("/login").post(authControllers.login);
router.route("/logout").get(authControllers.logout);
router.route("/signup").post(authControllers.signup);
router.route("/checkusername").post(userControllers.checkusername);
router.route("/public").get(userControllers.getPublicData);
router.delete("/file/:id", authControllers.protect, userControllers.deleteGalleryImage);

module.exports = router;
