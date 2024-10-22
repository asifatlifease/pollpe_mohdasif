const express = require("express");
const { Kafka } = require("kafkajs");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();

const kafka = new Kafka({
  clientId: "socketServer",
  brokers: [process.env.KAFKA_BROKER_IP],
});

const server = createServer(app, {
  cors: {
    origin: "*",
  },
});
const io = new Server(server);

io.on("connection", async (socket) => {
  socket.emit("test", { message: "test" });
  await consumeVoteProcessedTopic(socket);
  await consumeLeaderboardTopic(socket);
});

async function consumeVoteProcessedTopic(socket) {
  const consumer = kafka.consumer({ groupId: "socketSeverVoteTopicGroup" });
  await consumer.connect();

  await consumer.subscribe({
    topics: ["voteProcessedTopic"],
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
      console.log(
        `Process Vote sent to user ===> : [${topic}]: PART:${partition}:`,
        message.value.toString()
      );
      socket.emit("vote", JSON.parse(message.value));
    },
  });
}

async function consumeLeaderboardTopic(socket) {
  const consumer = kafka.consumer({
    groupId: "socketSeverLeaderboardTopicGroup",
  });
  await consumer.connect();

  await consumer.subscribe({
    topics: ["leaderboardTopic"],
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
      console.log(
        `leaderboardTopic Vote sent to user ===> : [${topic}]: PART:${partition}:`,
        message.value.toString()
      );
      socket.emit("leaderboard", JSON.parse(message.value));
    },
  });
}

server.listen(4000);
