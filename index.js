require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const nunjucks = require("nunjucks");
const multer = require("multer");
const basicAuth = require("express-basic-auth");
const { nanoid } = require("nanoid");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
const uploadDir = path.join(__dirname, "public", "uploads");

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());
// app.use(
//   basicAuth({
//     realm: "Web.",
//     challenge: true,
//     users: {
//       admin: process.env.PASSWORD,
//     },
//   })
// );

const DB = {
  users: [
    {
      _id: nanoid(),
      username: "admin",
      password: "1234",
      books: 0,
    },
  ],
  sessions: {},
};

const auth = () => async (req, res, next) => {
  if (!req.cookies || !req.cookies["sessionId"]) return next();

  const user = await findUserBySessionId(req.cookies["sessionId"]);
  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
};
const findUserByUsername = async (un) => DB.users.find(({ username }) => username === un);
const findUserBySessionId = async (sessionId) => {
  const userSessionId = DB.sessions[sessionId];

  if (!userSessionId) return;

  return DB.users.find(({ _id }) => userSessionId === _id);
};
const createSession = async (userId) => {
  const sessionId = nanoid();
  DB.sessions[sessionId] = userId;

  return sessionId;
};
const deleteSession = async (sessionId) => {
  delete DB.sessions[sessionId];
};
const fileFilter = (req, file, cb) => {
  cb(null, file.mimetype.match(/^image\//));
};
const upload = multer({
  dest: uploadDir,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
});

let count = 0;

const bootstrapCss =
  '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">';

app.get("/", (req, res) => {
  const counts = [];

  for (let i = 0; i < count; i++) {
    counts.push(99 - i);
  }
  res.render("index", { count, bootstrapCss, counts });
});

app.post("/inc", (req, res) => {
  const data = req.body;
  count += data.value || 1;
  res.json({ count });
});

app.get("/files", async (req, res) => {
  const files = (await fs.readdir(uploadDir)).sort().reverse();
  res.render("files", { files, bootstrapCss });
});

app.get("/books", auth(), (req, res) => {
  res.render("books", {
    bootstrapCss,
    user: req.user,
    authError: req.query.authError === "true",
  });
});

app.post("/upload", upload.single("image"), (req, res) => {
  res.redirect("/files", { bootstrapCss });
});

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(username);

  if (!user || user.password !== password) {
    return res.redirect("/books?authError=true");
  }

  const sessionId = await createSession(user._id);
  res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 500000 }).redirect("/books");
});

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/books");
  }

  await deleteSession(req.sessionId);
  res.clearCookie("sessionId").redirect("/books");
});

app.post("/add-book", auth(), async (req, res) => {
  if (!req.user) return res.sendStatus(401);

  const user = await findUserByUsername(req.user.username);
  user.books += 1;
  res.json({ books: user.books });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
