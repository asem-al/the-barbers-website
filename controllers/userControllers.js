const fs = require("fs");
const fsp = require("fs/promises");
const sharp = require("sharp");
const users = require("../models/userModel");

const fileNamesIn = (path) => {
  try {
    // Get the file names inside the specified path
    const files = fs.readdirSync(path);

    // Return the array of file names
    return files;
  } catch (error) {
    console.error("Error reading directory:", error);
    return []; // Return an empty array if there's an error
  }
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

exports.deleteGalleryImage = async (req, res) => {
  try {
    const dir = __dirname + "/.." + "/public/images/" + req.username + "/gallery/";
    await fsp.unlink(dir + req.params.id);
    const files = await fsp.readdir(dir);
    await users.findOneAndUpdate({ username: req.username }, { ["userMediaAndContent.media.images"]: files }, { new: true });
    res.status(204).end();
  } catch (err) {
    console.log(err);
  }
};

exports.EditUserInfo = async (req, res) => {
  const username = req.username;

  try {
    // TODO The user should be loged in. TODO changing phone number or email should require verification

    const jsonData = JSON.parse(req.body.jsonData);

    // 1. auth
    if (username != jsonData.username) {
      throw Error("badreq");
    }
    let user = await users.findOne({ username: jsonData.username }).select("+password");
    if (!user || !(await user.checkPassword(jsonData.password, user.password))) {
      return res.status(401).json({
        status: "fail",
        msg: "incorrect username or password",
      });
    }

    // 2. add files names to json data and write the files.
    const userFolderPath = __dirname + "/.." + "/public/images/" + username + "/";

    if (req.files && req.files.logo && req.files.logo.mimetype.split("/")[0] === "image") {
      await deleteFilesWithCommonNames(userFolderPath, "logo");
      await fsp.writeFile(userFolderPath + "logo." + req.files.logo.mimetype.split("/")[1], req.files.logo.data);
      jsonData.userMediaAndContent.media.logo = userFolderPath + "logo." + req.files.logo.mimetype.split("/")[1];
    }

    if (req.files && req.files.cover && req.files.cover.mimetype.split("/")[0] === "image") {
      await deleteFilesWithCommonNames(userFolderPath, "cover");
      await fsp.writeFile(userFolderPath + "cover." + req.files.cover.mimetype.split("/")[1], req.files.cover.data);
      jsonData.userMediaAndContent.media.heroImage = userFolderPath + "cover." + req.files.cover.mimetype.split("/")[1];
    }

    const galleryPath = userFolderPath + "gallery/";

    if (!fs.existsSync(galleryPath)) {
      fs.mkdirSync(galleryPath, { recursive: true });
    }

    jsonData.userMediaAndContent.media.images = fileNamesIn(galleryPath);

    if (
      (jsonData.userMediaAndContent.media.images.length >= 18 && req.files && req.files.img) ||
      (req.files && req.files.img && req.files.img.length && jsonData.userMediaAndContent.media.images.length + req.files.img.length > 18)
    ) {
      return res.status(400).json({
        status: "fail",
        message: "Can't add more then 18 gallery image",
      });
    }

    // add the new gallery images.
    if (req.files && req.files.img) {
      if (req.files.img.length) {
        for (let i = 0; i < req.files.img.length; i++) {
          const sharp_instance = sharp(req.files.img[i].data);
          const metadata = await sharp_instance.metadata();
          if (metadata.width > 1080) {
            sharp_instance.resize(1080);
          }

          const filename = "img-" + username + "-" + Date.now() + Math.random().toString(36).slice(2) + "." + req.files.img[i].mimetype.split("/")[1];

          const filePathAndName = galleryPath + filename;
          await sharp_instance.withMetadata().toFile(filePathAndName);

          jsonData.userMediaAndContent.media.images.push(filePathAndName);
        }
      } else {
        const sharp_instance = sharp(req.files.img.data);
        const metadata = await sharp_instance.metadata();
        if (metadata.width > 1080) {
          sharp_instance.resize(1080);
        }

        const filename = "img-" + username + "-" + Date.now() + Math.random().toString(36).slice(2) + "." + req.files.img.mimetype.split("/")[1];

        const filePathAndName = galleryPath + filename;
        await sharp_instance.withMetadata().toFile(filePathAndName);

        jsonData.userMediaAndContent.media.images.push(filePathAndName);
      }
    }

    const productsPath = userFolderPath + "products/";

    if (!fs.existsSync(productsPath)) {
      fs.mkdirSync(productsPath, { recursive: true });
    }

    if (jsonData.products.length > 40) {
      return res.status(400).json({
        status: "fail",
        message: "Can't add more then 40 products",
      });
    }
    if (req.files && jsonData.products) {
      for (let i = 0; i < jsonData.products.length; i++) {
        const file = req.files[jsonData.products[i].id];
        if (file) {
          const sharp_instance = sharp(file.data);
          sharp_instance.jpeg().resize({ width: 900, height: 900, fit: "cover" });

          const filename = "prod-" + jsonData.products[i].id + ".jpeg";

          const filePathAndName = productsPath + filename;

          await sharp_instance.withMetadata().toFile(filePathAndName);
        }
      }
    }

    // delete images of deleted products.
    const existingProducts = jsonData.products.map((el) => "prod-" + el.id + ".jpeg");
    const productsImages = fileNamesIn(productsPath);
    const imagesWithNoProduct = productsImages.filter((el) => !existingProducts.includes(el));

    for (let i = 0; i < imagesWithNoProduct.length; i++) {
      await fsp.unlink(productsPath + imagesWithNoProduct[i]);
    }

    // 3. update db.
    delete jsonData.username;
    delete jsonData.password;

    user = await users.findByIdAndUpdate(
      user.id, // query
      jsonData, // update to
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
