var express = require("express");
var router = express.Router();
const dbo = require("../db/conn");

router.post("/", async (req, res, next) => {
  console.log("register--", req.body);

  const db = dbo.getDb();
  try {
    const result_email = await db.collection("user").findOne({
      email: String(req.body.email),
    });
    console.log("check", result_email);
    if (result_email == null) {
      try {
        const result = await db.collection("user").insertOne({
          email: String(req.body.email),
          pass: String(req.body.pass),
          city: String(req.body.city),
        });
        console.log(`Added a new match with id ${result.insertedId}`);
        res.status(200).json({ id: result.insertedId });
      } catch {
        res.status(400).json({ msg: "Error inserting matches!" });
      }
    } else {
      res.status(403).json({ msg: "Email ou senha incorreto" });
    }
  } catch (err) {
    console.log("err", err);
    res.status(400).json({ msg: "Error fetching listings!" });
  }
});

module.exports = router;
