const express = require("express");
const AppointmantControllers = require("../controllers/AppointmantControllers");
const auth = require("../controllers/authControllers");
const filesController = require("../controllers/filesControllers");
const router = express.Router();

/// Param Midlleware
// router.param("id", (req, res, next, val) => {
//     console.log(`id is: ${val}.`);
//next();
// });

// router.route("/").get();

router
  .route("/")
  .get(AppointmantControllers.getPublicData) // make one for user and one for client
  .post(AppointmantControllers.createAppo)
  .patch(AppointmantControllers.modifyAppo) // protect in another way using the name and phonenumber
  .delete(AppointmantControllers.deleteAppo); // protect in another way using the name and phonenumber
router.route("/admin").get(auth.protect, AppointmantControllers.getAllAppo);
router.route("/one").get(AppointmantControllers.getOneAppo);
router.route("/deleteAll").delete(AppointmantControllers.deleteAll);
router.route("check").get(AppointmantControllers.checkForMultiAppo); // DELETE
router.route("/file").post(auth.protect, filesController.validateFileInfo, filesController.uploadFile);
router.delete("/file/:id", auth.protect, filesController.deleteFile);

module.exports = router;
