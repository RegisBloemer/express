var express = require("express");
var router = express.Router();
const dbo = require("../db/conn");

router.post("/", async (req, res, next) => {
  console.log("login--", req.body);
  const db = dbo.getDb();
  try {
    const result = await db.collection("user").find({
      $and: [
        {
          email: String(req.body.email),
        },
        {
          pass: String(req.body.pass),
        },
      ],
    }).toArray();
    console.log("result",result)
    res.json({id:result[0]._id});
  } catch {
    res.status(400).json({ msg: "Error fetching listings!" });
  }
});

module.exports = router;
