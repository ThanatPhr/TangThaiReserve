const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const auth = require("./routes/auth");
const restaurants = require("./routes/restaurants");

dotenv.config({ path: "./config/config.env" });
connectDB();

const app = express();

app.use(express.json());

app.use("/api/v1/auth", auth);
app.use("/api/v1/restaurants", restaurants);

const PORT = process.env.PORT || 3333;

const sever = app.listen(
  PORT,
  console.log("Server running in", process.env.NODE_ENV, "mode on port", PORT)
);

process.on("unhandledRejection", (error, promise) => {
  console.log(`Error: ${error.message}`);
  sever.close(() => {
    process.exit(1);
  });
});
