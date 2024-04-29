const express = require("express");
const AppointmantControllers = require("../controllers/AppointmantControllers");
const auth = require("../controllers/authControllers");
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
router.route("/admin").get(auth.protect, AppointmantControllers.getAllAppo).post(auth.protect, AppointmantControllers.createEmptyAppo);
router.route("/admin/:id").delete(auth.protect, AppointmantControllers.freeTime);
module.exports = router;
