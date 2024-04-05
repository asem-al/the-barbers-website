const users = require("../models/userModel");

exports.getUserInfo = async (req, res) => {
  const user = req.username;
  try {
    const userInfo = await users.findOne({ username: user });
    res.status(200).json({
      status: "success",
      data: userInfo,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
exports.EditUserInfo = async (req, res) => {
  const username = req.username;
  // console.log("-----EditUserInfo-----");
  // console.log(req.body);
  // console.log("-----EditUserInfo-----");

  try {
    // TODO The user should be loged in. TODO changing phone number or email should require verification
    if (username != req.body.username) {
      throw Error("badreq");
    }
    let user = await users.findOne({ username: req.body.username }).select("+password");
    if (!user || !(await user.checkPassword(req.body.password, user.password))) {
      return res.status(401).json({
        status: "fail",
        msg: "incorrect username or password",
      });
    }
    delete req.body.username;
    delete req.body.password;
    user = await users.findByIdAndUpdate(
      user.id, // query
      req.body, // update to
      { new: true, runValidators: true } // options
    );
    res.status(204).json({
      status: "success",
      data: user,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: "",
    });
  }
};

exports.deleteUser = async (req, res) => {};

exports.checkusername = async (req, res) => {
  try {
    const username = req.body.username;
    const unique = !(await users.exists({ username: username }));
    if (unique) res.json({ unique: true });
    else res.json({ unique: false });
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
};

exports.getPublicData = async (req, res) => {
  const user = req.username;
  try {
    const userInfo = await users.findOne({ username: user });

    // const publicData = {
    //   products: userInfo.products,
    //   userMediaAndContent: userInfo.userMediaAndContent,
    // };

    const publicData = userInfo;
    res.status(200).json({
      status: "success",
      data: publicData,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
