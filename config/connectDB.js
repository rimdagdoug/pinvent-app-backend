const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Error connecting to database:", error.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
