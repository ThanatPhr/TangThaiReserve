const mongoose = require('mongoose')

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: [50, 'Name can not be more than 50 characters'],
  },

  address: {
    type: String,
    required: [true, 'Please add an address'],
  },

  tel: {
    type: String,
    match: [
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im,
      'Please add a valid phone number',
    ],
  },

  openTime: {
    type: String,
    required: [true, 'Please add an open time'],
    match: [
      /^([01][0-9]|2[0-3]):[0-5][0-9]$/,
      'Please add a valid time in format 00:00',
    ],
  },

  closeTime: {
    type: String,
    required: [true, 'Please add a close time'],
    match: [
      /^([01][0-9]|2[0-3]):[0-5][0-9]$/,
      'Please add a valid time in format 00:00',
    ],
  },

  reservationCost: {
    type: Number,
    require: [true, 'Please add a reservation cost'],
    min: 0,
  },
})

RestaurantSchema.pre('remove', async function (next) {
  await this.model('Reservation').deleteMany({ restaurant: this._id })
  next()
})

RestaurantSchema.virtual('reservations', {
  ref: 'Reservation',
  localField: '_id',
  foreignField: 'restaurant',
  justOne: false,
})

module.exports = mongoose.model('Restaurant', RestaurantSchema)
