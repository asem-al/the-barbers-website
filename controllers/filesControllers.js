const fs = require("fs");
const sharp = require("sharp");
const fsp = require("fs/promises");
const users = require("../models/userModel");

const FILES_LIMIT = 10;

const updateUserImages = async (dir, username, key, ext) => {
  let updatedUser = "";
  let filepath;
  let dbpath;

  if (key === "cover") {
    filepath = "public/images/" + username + "/";
    dbpath = "userMediaAndContent.media.heroImage";
    const updatedCover = filepath + key + ext;
    updatedUser = await users.findOneAndUpdate({ username: username }, { [dbpath]: updatedCover }, { new: true });
  } else if (key === "logo") {
    filepath = "public/images/" + username + "/";
    dbpath = "userMediaAndContent.media.logo";
    const updatedLogo = filepath + key + ext;
    updatedUser = await users.findOneAndUpdate({ username: username }, { [dbpath]: updatedLogo }, { new: true });
  } else if (key.substring(0, 4) === "img-") {
    filepath = "public/images/" + username + "/gallery/";
    dbpath = "userMediaAndContent.media.images";
    const files = await fsp.readdir(dir);
    const updatedImages = files.map((el) => filepath + el);
    updatedUser = await users.findOneAndUpdate({ username: username }, { [dbpath]: updatedImages }, { new: true });
  } else if (key.substring(0, 5) === "prod-") {
    filepath = "public/images/" + username + "/products/";
    dbpath = `products.${Number(key.substring(5))}.image`;
    const updatedImageName = filepath + key + ext;
    updatedUser = await users.findOneAndUpdate({ username: username }, { [dbpath]: updatedImageName }, { new: true });
  }

  return updatedUser;
};

const deleteFilesWithCommonNames = async (dir, fileFirstName) => {
  let path = "";
  const extensions = [".jpeg", ".png", ".webp"];
  let deleted = false;
  for (const ext of extensions) {
    path = dir + fileFirstName + ext;

    if (fs.existsSync(path)) {
      await fsp.unlink(path);
      deleted = true;
    }
  }
  return deleted;
};

exports.validateFileInfo = (req, res, next) => {
  const key = Object.keys(req.files)[0];

  // Validate file type

  switch (req.files[key].mimetype) {
    case "image/jpeg":
      req.files[key].fileTypeExtension = ".jpeg";

      break;
    case "image/png":
      req.files[key].fileTypeExtension = ".png";

      break;
    case "image/webp":
      req.files[key].fileTypeExtension = ".webp";

      break;
    default:
      return res.status(400).json({ status: "fail", message: "Unsupported file type" });
  }

  // Validate key
  let expectedKey = false;
  if (
    key === "logo" ||
    key === "cover" ||
    (key.substring(0, 4) === "img-" && 0 <= Number(key.substring(4)) && Number(key.substring(4)) < FILES_LIMIT) ||
    (key.substring(0, 5) === "prod-" && 0 <= Number(key.substring(5)))
  ) {
    expectedKey = true;
  }
  if (!expectedKey) {
    return res.status(400).json({ status: "fail", message: "bad requist" });
  }

  next();
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).send("No files were uploaded.");
      return;
    }
    const key = Object.keys(req.files)[0];

    let dir = "";
    if (key === "cover" || key === "logo") {
      req.imageCategory = key;
      dir = __dirname + "/../public/images/" + req.username + "/";
    } else if (key.substring(0, 4) === "img-") {
      req.imageCategory = "gallery";
      dir = __dirname + "/../public/images/" + req.username + "/gallery/";
    } else if (key.substring(0, 5) === "prod-") {
      req.imageCategory = "product";
      dir = __dirname + "/../public/images/" + req.username + "/products/";
    }

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Delete existing images with the same name but different extensions
    deleteFilesWithCommonNames(dir, key);

    const fname = dir + key + req.files[key].fileTypeExtension;

    const sharp_instance = sharp(req.files[key].data);

    if (req.imageCategory === "product") {
      sharp_instance.resize({ width: 800, height: 800, fit: "cover" });
    } else {
      const metadata = await sharp_instance.metadata();
      if (metadata.width > 1080) {
        sharp_instance.resize(1080);
      }
    }

    await sharp_instance.withMetadata().toFile(fname); // https://stackoverflow.com/questions/48716266/sharp-image-library-rotates-image-when-resizing

    // update the pathes array of user images in db.
    const updatedUser = await updateUserImages(dir, req.username, key, req.files[key].fileTypeExtension);

    res.status(201).end();
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};

exports.deleteFile = async (req, res) => {
  const key = req.params.id; //the file name.
  let dir = "";
  if (key === "logo" || key === "cover") {
    dir = __dirname + "/../public/images/" + req.username + "/";
  } else if (key.substring(0, 4) === "img-") {
    dir = __dirname + "/../public/images/" + req.username + "/gallery/";
  } else if (key.substring(0, 5) === "prod-") {
    dir = __dirname + "/../public/images/" + req.username + "/products/";
  }

  try {
    // 1. find and delete the image.
    const deleted = await deleteFilesWithCommonNames(dir, key);

    // 2. Rename gallery images after delete to keep them sequential
    if (deleted) {
      let files = await fsp.readdir(dir);
      let c = 0;
      for (const file of files) {
        if (file.startsWith("img-")) {
          const x = file.split(".");
          const ext = "." + x[x.length - 1];
          await fsp.rename(dir + file, dir + `img-${c}${ext}`);
          c++;
        }
      }

      // 3. update the pathes array of user images in db.
      const updatedUser = await updateUserImages(dir, req.username);
      if (updatedUser) {
        console.log("user images has been updated.");
        res.status(204).end();
      } else {
        throw Error("Could not update user images");
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
};
