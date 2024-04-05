const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const compression = require("compression");

const AppointmanRouter = require("./routes/dataRouter");
const userRouter = require("./routes/userRouter");
const serverRouter = require("./routes/serverRouter");

const ViewEngine = require("./modules/ViewEngine");

const app = express();

const avaliable_languages = ["en", "tr", "ar", "de"]; // lan at index 0 is the default.

const users = require("./models/userModel");

app.set("view engine", "html");
app.engine("html", ViewEngine);

//
///     Middlewares     ///
//

// 1)
app.use(express.json());

// 2)
// app.use(bodyParser.urlencoded({ limit: "5000mb", extended: true, parameterLimit: 100000000000 }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.text());

app.use(
  fileUpload({
    limits: { fileSize: 20 * 1024 * 1024 },
  })
);

app.use(cookieParser());

// 3) Add some information to the request obj
app.use((req, res, next) => {
  // 1) Add user name to req.
  if (req.subdomains !== "thebarberswebsite-bd23b144c280") {
    req.username = req.subdomains[0];
  }

  console.log(req.subdomains);
  // console.log("------------------------");
  // console.log("req.username: ", req.username);
  // console.log("req.url: ", req.url);
  // console.log("req.query: ", req.query);
  // console.log("req.headers ", req.headers);
  // console.log("req.body ", req.body);
  next();
});

app.use(compression());

//
///      Routing     ///
//

app.use("/*/public", express.static(`${__dirname}/public`, { extensions: ["png", "webp", "jpeg"] }));

app.use("/favicon.ico", express.static("./public/favicons/favicon.ico"));

app.use("/data", AppointmanRouter); // appointments' data API.

app.use("/user", userRouter); // users' data API.

app.use("/test", (req, res) => {
  console.log(req.body);
  res.end("ok");
});

// Add some information to the request obj 2
app.use(async (req, res, next) => {
  // 2) add user info
  if (req.username) {
    req.userInfo = await users.findOne({ username: req.username }).select("-password");
  }

  // 3) Attach the "accept-language" prop to the req object
  if (req.method === "GET") {
    let avaliableLanguages;
    if (req.userInfo && req.username) {
      avaliableLanguages = req.userInfo.userMediaAndContent.media.languages;
    } else {
      avaliableLanguages = avaliable_languages;
    }
    const acceptLanguageHeader = req.headers["accept-language"];
    if (acceptLanguageHeader) {
      const languageTags = acceptLanguageHeader.split(",");

      const languages = languageTags.map((tag) => {
        const [language, quality] = tag.trim().split(";q=");
        return {
          language: language,
          quality: parseFloat(quality) || 1.0,
        };
      });

      for (let i = 0; i < languages.length; i++) {
        if (avaliableLanguages.includes(languages[i].language)) {
          req.preferredLanguage = languages[i].language;
          break;
        }
      }
    }

    if (!req.preferredLanguage) req.preferredLanguage = avaliableLanguages[0];
  }

  next();
});

app.get("/avaliablelanguages", (req, res) =>
  res.status(200).json({
    avaliablelanguages: avaliable_languages,
  })
);

// 4) Redirect
app.get("/:language?", (req, res, next) => {
  const language = req.params.language;

  let url;
  if (!language) {
    url = `${req.preferredLanguage}${req.url}`;
    res.status(301).redirect(url);
  } else if (!avaliable_languages.includes(language)) {
    url = `${req.preferredLanguage}${req.url}`;
    res.status(301).redirect(url);
  } else {
    next();
  }
});

app.use(
  "/:language",
  (req, res, next) => {
    const language = req.params.language;
    req.preferredLanguage = language;
    next();
  },
  serverRouter
);

app.use((req, res) => {
  res.status(404).sendFile("404.html", { root: `${__dirname}/views` });
});

module.exports = app;
