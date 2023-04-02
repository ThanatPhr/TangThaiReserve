const express = require("express");
const { getRestaurants } = require("../controllers/restaurants");

const router = express.Router();

router.route("/").get(getRestaurants);

module.exports = router;
