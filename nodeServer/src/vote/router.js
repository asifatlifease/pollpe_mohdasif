const router = require("express").Router();
const { setUserVote } = require("./controller");

router.post("/", setUserVote);

module.exports = router;
