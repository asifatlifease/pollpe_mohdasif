const express = require("express");
const app = express();
const router = express.Router();
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const routes = require("../src/routes");
const cors = require('cors');


app.use(express.json());
app.use(cookieParser());

app.all("*", (req, res, next) => {
  const obj = {
    host: req.headers.host,
    contentType: req.headers["content-type"],
    url: req.originalUrl,
    method: req.method,
    query: req.query,
    cookie: req.headers.cookie,
    body: req.body,
    params: req.params[0],
  };
  console.log("Logging the request ========>", [obj]);
  next();
});

app.use(cors({
  origin: "*"
}));

app.use((req, res, next) => {
  let anonymousId = req.cookies.anonymousId;

  if (!anonymousId) {
    anonymousId = uuidv4();
    res.cookie("anonymousId", anonymousId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // valid for 30 days
      httpOnly: true,
    });
  }
  req.anonymousId = anonymousId;
  next();
});

app.use(routes);
module.exports = { app, router };
