const express = require('express')

const { protect, authorize } = require('../middleware/auth')

const {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require('../controllers/restaurants')

const reservationRouter = require('./reservations')

const router = express.Router()

router.use('/:restaurantId/reservations', reservationRouter)

router
  .route('/')
  .get(getRestaurants)
  .post(protect, authorize('admin'), createRestaurant)

router
  .route('/:id')
  .get(getRestaurant)
  .delete(protect, authorize('admin'), deleteRestaurant)
  .put(protect, authorize('admin'), updateRestaurant)

module.exports = router
