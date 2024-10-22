const { Kafka } = require("kafkajs");
require("dotenv").config()

exports.kafka = new Kafka({
  clientId: "pollpe",
  brokers: [`${process.env.KAFKA_BROKER_IP}`],
});