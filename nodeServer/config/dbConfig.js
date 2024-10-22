const mongoose = require("mongoose");
const connectDb = async (dbUrl) => {
  try {
    await mongoose.connect(dbUrl);
    console.log("Databse connected successully.");
  } catch (error) {
    console.log(error);
  }
};

module.exports = connectDb;
