const express = require('express')

const {
  getReservations,
  getReservation,
  addReservation,
  updateReservation,
  deleteReservation,
  payReservation,
} = require('../controllers/reservations')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router({ mergeParams: true })

router
  .route('/')
  .get(protect, getReservations)
  .post(protect, authorize('admin', 'user'), addReservation)
router
  .route('/:id')
  .get(protect, getReservation)
  .put(protect, authorize('admin', 'user'), updateReservation)
  .delete(protect, authorize('admin', 'user'), deleteReservation)
router.route('/pay').post(protect, authorize('admin', 'user'), payReservation)

module.exports = router
