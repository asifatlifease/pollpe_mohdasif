# Poll Voting Microservices Architecture

This project demonstrates a microservice architecture with two core services:

1. **Node.js Server** (to be scaled later)
2. **Kafka** (as a pub-sub system)
3. **WebSocket Server** (to be scaled for millions of users)

## Technologies Used
- **Node.js**
- **Kafka with Zookeeper** (I have added kafka.sh script to run just make sure to put your <ip-address>)
- **Socket**
- **MongoDB** (chosen due to time constraints, but can also be implemented using MySQL or PostgreSQL)
- **Docker** (currently used only for running Kafka and Zookeeper)

> **Note:** This architecture is not fully optimized for large-scale production but can be used for small-scale applications. Its applicability depends on various use cases.

![Architecture Diagram](https://github.com/user-attachments/assets/840f6889-b589-4106-97a8-ef1d43201f55)

## Kafka Topics and Consumers

### Kafka Topics
1. **voteTopic**:  
   After receiving votes from the API, they are pushed to `voteTopic` for further processing.

2. **voteProcessedTopic**:  
   Once the votes are processed, they are pushed to `voteProcessedTopic`. This topic handles:
   - Updating the vote, poll, and leaderboard in the database.
   - Broadcasting real-time updates to users through the WebSocket server.

3. **leaderboardTopic**:  
   Updates related to the leaderboard are pushed to `leaderboardTopic` for real-time consumption by the WebSocket server.

### Kafka Consumers

#### Node.js Microservice:
- **Group ID: `voteGroup`**  
  - Consumes messages from `voteTopic`.

- **Group ID: `updateDbAndLeaderboardGroup`**  
  - Consumes messages from `voteProcessedTopic` to update the database and leaderboard.

#### WebSocket Microservice:
- **Group ID: `socketServerVoteTopicGroup`**  
  - Consumes messages from `voteProcessedTopic` to emit real-time updates to users.

- **Group ID: `socketServerLeaderboardTopicGroup`**  
  - Consumes messages from `leaderboardTopic` to provide real-time leaderboard updates to users.

---

## Setup to Run on Local Machine

### Prerequisites
- **Docker** must be installed on your machine (used only for running Zookeeper and Kafka).
- **MongoDB** should be running locally.

### Setup Instructions

#### 1. Start Zookeeper
Run the following command to start the Zookeeper container and expose port `2181`:

  ```bash
  docker run -p 2181:2181 zookeeper
  
  docker run -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=<PRIVATE_IP>:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://<PRIVATE_IP>:9092 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  confluentinc/cp-kafka

 ```

#### Set Up MongoDB
  ```bash
  mongodb://localhost:27017/pollpe
  ```


#### Make sure to change .env file kafka broker <ip-address> in both nodeServer and socketServer
  ```bash
  exports.kafka = new Kafka({
    clientId: "pollpe",
    brokers: ["<PRIVATE_IP>:9092"], // Replace with your private IP
  });
  ```

#### Start Node.js Server (nodeServer)
  ```bash
  npm install
  npm run start
  ```

#### Start WebSocket Server
  ```bash
  npm install
  npm run start
  ```


## API's & WebSocket

### API Endpoints
  ```bash
  Base URL: `http://localhost:5000/`
  ```

> **Note:** Copy and paste the curl commands to run in Postman.

#### 1. Create Polls
**[POST]** `/polls/`

  ```bash
  curl --location 'http://localhost:5000/polls' \
  --header 'Content-Type: application/json' \
  --header 'Cookie: anonymousId=69ad2f0d-e874-45b0-b3f1-befffde15ac0' \
  --data '{
    "title": "Best frontend framework?",
    "description": "Which frontend framework do you prefer?",
    "image": "url-to-image",
    "totalVotes": 85,
    "isTie": false,
    "pollStatus": "active",
    "options": [
      { "text": "React", "voteCount": 60 },
      { "text": "Vue", "voteCount": 25 }
    ]
  }'
  ```


#### Get Polls
**[GET]** /polls/

  ```bash
  curl --location 'http://localhost:5000/polls/' \
  --header 'Cookie: anonymousId=69ad2f0d-e874-45b0-b3f1-befffde15ac0'
  ```


#### Get Leaderboard
**[GET]** /leaderboard/

  ```bash
  curl --location 'http://localhost:5000/leaderboard/' \
  --header 'Cookie: anonymousId=69ad2f0d-e874-45b0-b3f1-befffde15ac0'
  ```

#### Cast Vote
**[POST]** /votes/

  ```bash
  curl --location 'http://localhost:5000/votes/' \
  --header 'Content-Type: application/json' \
  --header 'Cookie: anonymousId=69ad2f0d-e874-45b0-b3f1-befffde15ac0' \
  --data '{
    "optionText": "Vue",
    "isVoted": true,
    "pollId": "6714db454fd407bae3289261"
  }'
  ```


#### WebSocket Endpoint

```bash
ws://localhost:4000
```

#### Socket Event Names

```bash
  vote
  leaderboard
  test
```


## Tracking User Without Authentication (Using Cookies)

### 1. User Visits Poll List Page
When a user first visits the poll list page, the server should:

- Check if an anonymous token exists in the user's cookies.

### 2. Check for Anonymous Token
- **If the token exists:**  
  The server retrieves the token and associates it with any previous voting data.

- **If the token does not exist:**  
  - Generate a unique user ID (e.g., a UUID).
  - Set this user ID in the cookies.
  - Send the user ID back to the client along with the poll list data.

### 3. Handling Logged-In and Non-Logged-In Users
- **If the user is logged in:**  
  It is easy to track if the user has voted by using the user ID retrieved from the authentication system.

- **If the user is not logged in:**  
  It can be more challenging to track the user, but several strategies can be used:
  - **Generate a user ID on the frontend:**  
    Store it in local storage or session storage and send it along with the request.
  - **Use the IP address:**  
    Track the user's IP address to identify them across sessions.
  - **Anonymous token:**  
    Generate a unique token on the server, set it in the cookies, and include it in the response.

### 4. Voting Restrictions
- In some cases, a user may only be allowed to vote once, or they may have the option to change their vote. This needs to be handled in the logic by checking either the user ID or anonymous token to enforce these rules.


