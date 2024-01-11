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

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
});

const auth = () => async (req, res, next) => {
  if (!req.cookies || !req.cookies["sessionId"]) return next();

  const user = await findUserBySessionId(req.cookies["sessionId"]);
  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
};
const findUserByUsername = async (username) =>
  knex("users")
    .select()
    .where({ username })
    .limit(1)
    .then((results) => results[0]);

const findUserBySessionId = async (sessionId) => {
  const session = await knex("sessions")
    .select("user_id")
    .where({ session_id: sessionId })
    .limit(1)
    .then((results) => results[0]);

  if (!session) return;

  return knex("users")
    .select()
    .where({ id: session.user_id })
    .limit(1)
    .then((results) => results[0]);
};

const createSession = async (userId) => {
  const sessionId = nanoid();

  await knex("sessions").insert({
    user_id: userId,
    session_id: sessionId,
  });

  return sessionId;
};
const deleteSession = async (sessionId) => {
  await knex("sessions").where({ session_id: sessionId }).delete();
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

  const sessionId = await createSession(user.id);
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

  const [books] = await knex("users")
    .where({ id: req.user.id })
    .update({ books: knex.raw(`books + 1`) })
    .returning("books");
  res.json({ books });
});

const port = process.env.PORT || 3004;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
