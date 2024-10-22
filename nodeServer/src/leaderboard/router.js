const router = require("express").Router();
const { getLeaderboard } = require("./controller");

router.get("/", getLeaderboard);


module.exports = router