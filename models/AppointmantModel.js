const mongoose = require("mongoose");
const { genRand } = require("../modules/utilities.js");
const dataSchema = new mongoose.Schema({
  state: {
    type: String,
    enum: ["Active", "Cancelled"],
    default: "Active",
  },
  code: {
    type: String,
    require: true,
    default: genRand(4),
    select: false,
  },
  date: {
    type: Date,
    require: true,
  },
  user: {
    type: String,
    require: true,
  },
  duration: {
    type: Number,
    require: true,
  },
  branch: {
    type: String,
    require: true,
  },
  employee: {
    type: String,
    require: true,
  }, // If the employee is not specified, in the server, assign the appointment to the least busy available employee.
  clientName: {
    type: String,
    require: true,
    select: false,
  },
  phoneNumber: {
    type: String,
    require: true,
    select: false,
  },
  details: String,
});

const Appointment = mongoose.model("Appointments", dataSchema);

module.exports = Appointment;
