// REVERT PACKAGE.JSON TYPE TO COMMON.JS

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
const { MongoClient, ObjectId } = require("mongodb");

const clientPromise = new MongoClient(process.env.DB_URI, {
  minPoolSize: 10,
  maxPoolSize: 11,
});

const router = express.Router();

const app = express();
const uploadDir = path.join(__dirname, "public", "uploads");

app.use(async (req, res, next) => {
  try {
    const client = await clientPromise;
    req.db = client.db("users");
    next();
  } catch (err) {
    next(err);
  }
});

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

const auth = () => async (req, res, next) => {
  if (!req.cookies || !req.cookies["sessionId"]) return next();

  const user = await findUserBySessionId(req.db, req.cookies["sessionId"]);
  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
};

const findUserByUsername = async (db, username) => db.collection("users").findOne({ username });

const findUserBySessionId = async (db, sessionId) => {
  const session = await db.collection("sessions").findOne(
    { sessionId },
    {
      projection: { userId: 1 },
    }
  );

  if (!session) return;

  return db.collection("users").findOne({ _id: new ObjectId(session.userId) });
};

const createSession = async (db, userId) => {
  const sessionId = nanoid();

  await db.collection("sessions").insertOne({
    userId,
    sessionId,
  });

  return sessionId;
};
const deleteSession = async (db, sessionId) => {
  await db.collection("sessions").deleteOne({ sessionId });
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
  const user = await findUserByUsername(req.db, username);

  if (!user || user.password !== password) {
    return res.redirect("/books?authError=true");
  }

  const sessionId = await createSession(req.db, user._id);
  res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 500000 }).redirect("/books");
});

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/books");
  }

  await deleteSession(req.db, req.sessionId);
  res.clearCookie("sessionId").redirect("/books");
});

app.post("/add-book", auth(), async (req, res) => {
  if (!req.user) return res.sendStatus(401);

  const db = req.db;
  const response = await db.collection("users").findOneAndUpdate(
    {
      _id: new ObjectId(req.user._id),
    },
    {
      $inc: { books: 1 },
    },
    {
      returnOriginal: false,
    }
  );
  console.log(response);
  res.json({ books: response?.value?.books });
});

const port = process.env.PORT || 3004;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
