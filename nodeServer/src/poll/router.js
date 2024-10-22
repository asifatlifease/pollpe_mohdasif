const router = require("express").Router();
const { createPoll, getPolls } = require("./controller");

router.post("/", createPoll);
router.get("/", getPolls);

module.exports = router;
