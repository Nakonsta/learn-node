const express = require("express");
const pick = require("lodash/pick");
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

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await knex.select().table("users").where(req.query);
    res.json(users);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const user = await knex
      .select()
      .table("users")
      .where("personid", id)
      .then((data) => data[0]);
    if (user) res.json(user);
    else res.status(404).send("Unknown user");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.post("/", async (req, res) => {
  try {
    const data = pick(req.body, "personid", "name", "age", "country");
    const data2 = await knex("users").insert(data).returning("personid");
    res.header("location", `${req.protocol}://${req.hostname}/api/users/${data2.personid}`).sendStatus(201);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.patch("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = pick(req.body, "personid", "name", "age", "country");
    const updateCount = await knex("users").where("personid", id).update(data);
    if (updateCount === 0) res.status(404).send(`Unknown user id: ${id}`);
    else res.sendStatus(204);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = pick(req.body, "personid", "name", "age");
    const deleteCount = await knex("users").where("personid", id).delete();
    if (deleteCount === 0) res.status(404).send(`Unknown user id: ${id}`);
    else res.sendStatus(204);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
