const router = require("express").Router();

const pollRouter = require("./poll/router");
const voteRouter = require("./vote/router")
const leaderboardRouter = require("./leaderboard/router")

router.use("/polls", pollRouter);
router.use("/votes", voteRouter);
router.use("/leaderboard", leaderboardRouter);

module.exports = router;
