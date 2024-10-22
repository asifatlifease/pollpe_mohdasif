const { app } = require("./config/expressConfig");
const connectDb = require("./config/dbConfig");
const config = require("./config");
const {kafkaAdmin} = require("./services/kafka/admin");
const {consumeVoteProcessedTopic, consumeVoteTopic} = require("./services/kafka/consumer");

require("dotenv").config();
const PORT = config.conf.port || 5000;

(async () => {
  try {
    await kafkaAdmin()
    await consumeVoteTopic(); // Call the specific consumer method
    await consumeVoteProcessedTopic(); // Call the other consumer method
  } catch (error) {
    console.error('Error starting Kafka consumer:', error);
  }
})();

connectDb(`${process.env.DB_URL}`)

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
