const Appointment = require("./../models/AppointmantModel");
const users = require("../models/userModel");
const { signToken } = require("../modules/utilities.js");

exports.getAvailableTimes = async (req, res) => {
  try {
    const username = req.subdomains[0];
    const date = new Date(new Date().setUTCHours(0, 0, 0, 0));
    //  TODO لا ياخذ بعين الاعتبار فرق المنطقة الزمنية
    const AllData = await Appointment.findOne({ username: username, date: { $gte: date.toISOString() } });
    const user = await users.findOne({ username: username });
    // get opining and cloe hours for the week and send them with the booked times.
    const data = {};
    // const data = AllData.map((obj) => {
    //   const {}
    // });
    res.json({
      status: "success",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

const findBranch = (branches, branchName) => {
  for (let i = 0; i < branches.length; i++) {
    if (branches[i].name === branchName) {
      return branches[i];
    }
  }
  return null;
};

exports.createAppo = async (req, res) => {
  try {
    let newAppo = {};
    const user = await users.findOne({ username: req.username });

    const branch = findBranch(user.branches, req.body.branch);

    if (!user || !branch) {
      throw new Error("No such user or branch.");
    }

    const today = new Date(new Date().setUTCHours(0, 0, 0, 0));

    const duplicateAppo = await Appointment.findOne({
      user: req.username,
      clientName: req.body.name,
      phoneNumber: req.body.phone,
      date: { $gte: today.toISOString() }, // ??? iso string might couse shifts
    });

    if (duplicateAppo) {
      throw new Error("Duplicate appointmants");
    }

    const [hours, minutes] = req.body.time.split(":").map(Number);
    const date = new Date(new Date(req.body.date).setHours(hours, minutes));

    let barber = req.body.barber;

    if (barber === "Any") {
      // TODO
    }

    const conflictingAppo = await Appointment.findOne({
      user: req.username,
      branch: req.body.branch,
      employee: barber,
      date: date,
    });

    if (conflictingAppo) {
      throw new Error("conflicting appointmants");
    }

    const appoData = {
      date: date,
      user: req.username,
      duration: branch.shortestAppointmant,
      branch: req.body.branch,
      employee: barber,
      clientName: req.body.name,
      phoneNumber: req.body.phone,
    };

    newAppo = await Appointment.create(appoData);

    res.status(201).json({
      status: "success",
      data: newAppo,
    });
  } catch (err) {
    console.log(err);
    if (err.message === "conflicting appointmants" || err.message === "Duplicate appointmants" || err.message === "Bad Request") {
      res.status(400).json({
        status: "fail",
        message: err.message,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "Internal server error",
      });
    }
  }
};

exports.getAllAppo = async (req, res) => {
  try {
    const user = req.subdomains[0];
    const today = new Date(new Date().setUTCHours(0, 0, 0, 0));

    const data = await Appointment.find({
      user: user,
      date: { $gte: today.toISOString() },
    });

    res.json({
      status: "success",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
exports.getOneAppo = async (req, res) => {
  try {
    const user = req.subdomains[0];
    const name = req.body.name;
    const phoneNumber = req.body.phoneNumber;

    // يجب منع المستخدم من اخذ اكثر من موعد في نفس الوقت في طرف المستخدم
    const data = await Appointment.findOne({ user: user, clientName: name, phoneNumber: phoneNumber });

    res.json({
      status: "success",
      data: data,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

// TODO allow deleting or modifying only if there is a valid client token or user token.

exports.deleteAppo = async (req, res) => {
  try {
    const user = req.subdomains[0];
    const name = req.body.name;
    const phoneNumber = req.body.phoneNumber;
    await Appointment.deleteOne({ user: user, name: name, phoneNumber: phoneNumber });
    res.status(204).end();
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
exports.modifyAppo = async (req, res) => {
  try {
    const user = req.subdomains[0];
    const searchQuery = req.body.query;
    searchQuery.user = user;
    const newData = req.body.newdata;

    await Appointment.updateOne(searchQuery, newData);

    res.status(201).json({
      status: "success",
      data: newData,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteAll = async (req, res) => {
  // DELETE
  try {
    await Appointment.deleteMany({});
    res.status(204).end();
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
};
exports.checkForMultiAppo = async (req, res) => {}; // DELETE the check is done on creating.

exports.getPublicData = async (req, res) => {
  try {
    const user = req.subdomains[0];
    const date = new Date(new Date().setUTCHours(0, 0, 0, 0));

    const data = await Appointment.find({ user: user, date: { $gte: date.toISOString() } });

    const publicData = data;

    res.json({
      status: "success",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
