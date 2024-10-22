const { kafka } = require("./index");

async function init() {
  const admin = kafka.admin();
  try {
    console.log("Admin connecting...");
    await admin.connect();
    console.log("Admin Connection Success...");

    const topics = await admin.listTopics();
    console.log("Existing Topics:", topics);

    if (
      !topics.includes("voteTopic") ||
      !topics.includes("voteProcessedTopic") ||
      !topics.includes("leaderboardTopic")
    ) {
      console.log("Creating Topics [voteTopic, voteProcessedTopic, leaderboardTopic]");

      // for the ease i just created one partition but according the use cases we can do multiple partitons
      await admin.createTopics({
        topics: [
          {
            topic: "voteTopic", // this "voteTopic" store the votes that user hit the vote api
            numPartitions: 1,
            replicationFactor: 1,
          },
          {
            topic: "voteProcessedTopic", // afte consuming from the voteTopic and process pushing into "voteProcessedTopic" so later i can do batch operation on db
            numPartitions: 1,
            replicationFactor: 1,
          },
          {
            topic: "leaderboardTopic", // push after updating the leaderboard db so it can consume from sokcet server and send to users for realtime update of leaderboard
            numPartitions: 1,
            replicationFactor: 1,
          },
        ],
      });

      console.log("Topics created successfully");
    } else {
      console.log("Topics already exist");
    }
  } catch (error) {
    console.error("Error creating topics:", error);
  } finally {
    console.log("Disconnecting Admin..");
    await admin.disconnect();
  }
}

module.exports = {
  kafkaAdmin: init,
};
