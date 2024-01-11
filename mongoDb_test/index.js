// REVERT PACKAGE.JSON TYPE TO COMMON.JS

require("dotenv").config();
const { MongoClient } = require("mongodb");
const express = require("express");

const app = express();

app.use(express.json());
app.use("/api/users", require("./users"));
app.use((err, req, res, next) => res.status(500).send(err.message));

const port = process.env.PORT || 3004;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});

// const client = new MongoClient(process.env.DB_URI);

// (async () => {
//   try {
//     await client.connect();

//     const name = process.argv[2];

//     const db = client.db("users");
//     const res = await db
//       .collection("users")
//       .find({
//         name,
//       })
//       .toArray();

//     console.log(res);
//   } catch (err) {
//     console.err(res);
//   }

//   await client.close();
// })();
