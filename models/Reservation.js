const mongoose = require('mongoose')

const ReservationSchema = new mongoose.Schema({
  reserveDate: {
    type: Date,
    required: true,
  },

  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },

  restaurant: {
    type: mongoose.Schema.ObjectId,
    ref: 'Restaurant',
    required: true,
  },

  createAt: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid',
  },
})

module.exports = mongoose.model('Reservation', ReservationSchema)
