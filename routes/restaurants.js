const express = require("express");
const {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require("../controllers/restaurants");

const router = express.Router();

router
  .route("/")
  .get(getRestaurants)
  .post(/* protect, authorize("admin"),*/ createRestaurant);

router
  .route("/:id")
  .get(getRestaurant)
  .delete(/*protect, authorize("admin"), */ deleteRestaurant)
  .put(/*protect, authorize("admin"), */ updateRestaurant);

module.exports = router;
