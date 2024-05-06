const crypto = require("crypto");
const fs = require("fs");
const util = require("util");
const users = require("../models/userModel");
const jwt = require("jsonwebtoken");
const path = require("path");
const sendEmail = require("../modules/email.js");

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const cookie_options = {
  expires: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  // secure: true, /// !!!!!!!!!!!!! Most turn on. it prevent sending the cookie over http.
  httpOnly: true,
  // domain: `${newUser.username}.ofset.localhost`,
};

// Function to copy a directory recursively
function copyDirectory(source, destination) {
  // Create destination folder if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
  }

  // Get all files and sub-directories in the source directory
  const files = fs.readdirSync(source);

  // Loop through each item in the source directory
  files.forEach((file) => {
    const srcPath = path.join(source, file);
    const destPath = path.join(destination, file);

    // Check if the item is a file or directory
    if (fs.lstatSync(srcPath).isDirectory()) {
      // If it's a directory, recursively copy it
      copyDirectory(srcPath, destPath);
    } else {
      // If it's a file, copy it to the destination
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

exports.signup = async (req, res) => {
  try {
    const newUser = await users.create(req.body);

    newUser.password = undefined;
    copyDirectory(`${__dirname}/../public/images/default`, `${__dirname}/../public/images/${newUser.username}`);
    res.status(201).json({
      status: "success",
      data: newUser,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      msg: err,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
      return res.status(400).json({
        status: "fail",
        msg: "username or password missing!",
      });
    }

    const user = await users.findOne({ username: req.username }).select("+password");

    if (!user || !(await user.checkPassword(password, user.password)) || phoneNumber != user.phoneNumber) {
      return res.status(401).json({
        status: "fail",
        msg: "incorrect username or password",
      });
    }
    const token = signToken({ id: user._id });
    res.cookie("jwt", token, cookie_options);
    //const redirectUrl = req.query.redirect ? req.query.redirect : "/";
    res.status(200).end();
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      msg: err,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1. check for token
    let token;
    token = req.cookies.jwt;

    if (!token) {
      throw new Error("noTokenError");
    }
    // 2. Verify token
    const decodedToken = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. check if user still exists
    const user = await users.findById(decodedToken.id);
    if (!user) {
      throw new Error("OwnerOfTokenNoLongerAUser");
    }

    // 4. check if the user who send the token is the same as the owner
    if (user.username != req.username) {
      throw new Error("WrongUserForThisToken");
    }

    // 5. check for password change after token issue date
    if (user.passwordChangrdAfter(decodedToken.iat)) {
      throw new Error("oldToken");
    }

    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.message === "OwnerOfTokenNoLongerAUser" || err.message === "WrongUserForThisToken") {
      return res.status(401).json({
        status: "fail",
        msg: "Unauthorized", //msg: "Invalid token",
      });
    }

    if (err.name === "TokenExpiredError" || err.message === "noTokenError" || err.message === "oldToken") {
      // Store the original URL the user was trying to access
      const originalUrl = req.originalUrl;

      // Redirect the user to the login page with the original URL as a parameter
      return res.redirect(`/login?redirect=${encodeURIComponent(originalUrl)}`);
    }
    console.log(err);
    return res.status(500).json({
      status: "fail",
      msg: err,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await users.findOne({ username: req.username });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: 1,
    });
    res.cookie("jwt", token, cookie_options);
    res.status(200).redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      msg: err,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    // 1. Get user.
    const user = await users.findOne({ phone: req.body.phone });

    if (!user || user.username !== req.username) {
      return res.status(400).json({
        status: "fail",
        msg: "Bad requist",
      });
    }
    // 2. Generate reset token.
    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });

    // 3. send it to user via email
    const resetURL = `${req.protocol}://${req.get("host")}/resetpassword/${resetToken}`;
    const message = `If you forgot your password you can reset it from the password Reset page at this link: ${resetURL}
    If you didn't, please ignore this email`;
    const html = `<p>If you forgot your password you can reset it from <a href="${resetURL}">the password Reset page</a>.<br/>If you didn't, please ignore this email</p>`;

    await sendEmail({
      to: user.email,
      subject: "Password reset Email",
      text: message,
      html: html,
    });

    res.status(200).json({
      status: "success",
      msg: "Token sent to email.",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: "fail",
      msg: "Server error",
    });
  }
};

exports.resetPassword = async (req, res) => {
  // 1. get user based on token.

  const hashedToken = crypto.createHash("sha256").update(req.params.resetToken).digest("hex");

  const user = await users.findOne({ ["accountdata.passwordResetToken"]: hashedToken, ["accountdata.passwordResetExpires"]: { $gt: Date.now() } });

  // 2. if there is user and token not expired, set the new passowrd.
  if (!user || user.username !== req.username) {
    return res.status(400).json({
      status: "fail",
      message: "bad requist",
    });
  }

  user.password = req.body.password;
  user.passwordConfirmation = req.body.passwordConfirmation;
  user.accountdata.passwordResetToken = undefined;
  user.accountdata.passwordResetExpires = undefined;
  await user.save();

  // 3. log in.
  const token = signToken({ id: user._id });
  res.cookie("jwt", token, cookie_options);
  res.status(200).redirect("/dashboard");
};
