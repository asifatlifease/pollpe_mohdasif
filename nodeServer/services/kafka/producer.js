const { kafka } = require("./index");

async function kafkaProducer(payload) {
  const producer = kafka.producer();
  try {
    await producer.connect();
    await producer.send({
      topic: payload.topicName,
      messages: [
        {
          key: payload.key,
          value: JSON.stringify(payload.value),
        },
      ],
    });
    console.log(`Message sent to ${payload.topicName}:`, payload.value);
  } catch (error) {
    console.error("Error sending message:", error);
  } finally {
    await producer.disconnect();
  }
}

module.exports = kafkaProducer;
