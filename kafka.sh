#!/bin/bash

# Function to check if a container exists
container_exists() {
  docker ps -a --format '{{.Names}}' | grep -w "$1" > /dev/null 2>&1
}

# Function to check if an image exists
image_exists() {
  docker images --format '{{.Repository}}' | grep -w "$1" > /dev/null 2>&1
}

# Stop and remove Zookeeper container if it exists
if container_exists zookeeper; then
  echo "Stopping and removing existing Zookeeper container..."
  docker stop zookeeper
  docker rm zookeeper
else
  echo "Zookeeper container not found."
fi

# Stop and remove Kafka container if it exists
if container_exists kafka; then
  echo "Stopping and removing existing Kafka container..."
  docker stop kafka
  docker rm kafka
else
  echo "Kafka container not found."
fi

# Run Zookeeper
docker run -d --name zookeeper -p 2181:2181 zookeeper

# Run Kafka
docker run -d --name kafka -p 9092:9092 \
-e KAFKA_ZOOKEEPER_CONNECT=192.168.1.20:2181 \
-e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://192.168.1.20:9092 \
-e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
confluentinc/cp-kafka
