const Reservation = require('../models/Reservation')
const Restaurant = require('../models/Restaurant')
const User = require('../models/User.js')
const Stripe = require('stripe')
const stripe = Stripe(
  'sk_test_51MzxiPHZmkvTgpLDrGyvvtkWVNT9ef48L9WEXMwOytWoAerFg2vyzh2MlNNaGKMualb1APugadNnpt2UjLTczBQy001VtB5ZhF'
)

exports.getReservations = async (req, res, next) => {
  let query

  if (req.user.role !== 'admin') {
    query = Reservation.find({ user: req.user.id }).populate({
      path: 'restaurant',
      select: 'name address tel',
    })
  } else {
    query = Reservation.find().populate({
      path: 'restaurant',
      select: 'name address tel',
    })
  }

  try {
    const reservations = await query

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Cannot find Reservation' })
  }
}

exports.getReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate({
      path: 'restaurant',
      select: 'name address tel',
    })

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `No reservation with the id of ${req.params.id}`,
      })
    }

    res.status(200).json({ success: true, data: reservation })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Cannot find Reservation' })
  }
}

exports.addReservation = async (req, res, next) => {
  try {
    req.body.reserveDate = new Date(req.body.reserveDate)
    req.body.restaurant = req.params.restaurantId

    const restaurant = await Restaurant.findById(req.params.restaurantId)

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: `No restaurant with the id of ${req.params.restaurantId}`,
      })
    }

    const reserveHour = req.body.reserveDate.getHours()
    const reserveMinute = req.body.reserveDate.getMinutes()
    if (
      req.body.reserveDate < new Date() ||
      !isValidReserveTime(
        restaurant.openTime,
        restaurant.closeTime,
        reserveHour,
        reserveMinute
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reserve time',
      })
    }

    req.body.user = req.user.id

    const existedReservation = await Reservation.find({ user: req.user.id })

    if (existedReservation.length >= 3 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} has already made 3 reservations`,
      })
    }

    const reservation = await Reservation.create(req.body)

    res.status(201).json({
      success: true,
      data: reservation,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.updateReservation = async (req, res, next) => {
  try {
    req.body.reserveDate = new Date(req.body.reserveDate)

    let reservation = await Reservation.findById(req.params.id).populate({
      path: 'restaurant',
      select: 'openTime closeTime',
    })

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `No reservation with the id of ${req.params.id}`,
      })
    }

    if (
      reservation.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this reservation`,
      })
    }

    const reserveHour = req.body.reserveDate.getHours()
    const reserveMinute = req.body.reserveDate.getMinutes()
    if (
      req.body.reserveDate < new Date() ||
      !isValidReserveTime(
        reservation.restaurant.openTime,
        reservation.restaurant.closeTime,
        reserveHour,
        reserveMinute
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reserve time',
      })
    }

    reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body.reserveDate,
      {
        new: true,
        runValidators: true,
      }
    )

    res.status(200).json({ success: true, data: reservation })
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: 'Cannot update Reservation' })
  }
}

exports.deleteReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `No reservation with the id of ${req.params.id}`,
      })
    }

    if (
      reservation.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this reservation`,
      })
    }

    await reservation.remove()

    res.status(200).json({ success: true, data: {} })
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: 'Cannot delete Reservation' })
  }
}

exports.payReservation = async (req, res, next) => {
  const { cardNumber, cardExpMonth, cardExpYear, cardCVC } = req.body
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const reservation = await Reservation.findById(req.params.id).populate({
      path: 'restaurant',
      select: 'reservationCost',
    })

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
      })
    }

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber,
        exp_month: cardExpMonth,
        exp_year: cardExpYear,
        cvc: cardCVC,
      },
    })

    const paymentIntent = await stripe.paymentIntents.create({
      payment_method: paymentMethod.id,
      payment_method_types: ['card'],
      amount: reservation.restaurant.reservationCost * 100,
      currency: 'thb',
      confirm: true,
      customer: user.reference,
    })

    if (paymentIntent.status == 'succeeded') {
      await Reservation.findByIdAndUpdate(
        req.params.id,
        {
          status: 'paid',
        },
        {
          new: true,
          runValidators: true,
        }
      )
    }

    return res.status(200).json({ success: true, message: paymentIntent })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

function isValidReserveTime(openTime, closeTime, hour, minute) {
  const openHour = parseInt(openTime.split(':')[0])
  const openMinute = parseInt(openTime.split(':')[1])
  const closeHour = parseInt(closeTime.split(':')[0])
  const closeMinute = parseInt(closeTime.split(':')[1])

  return (
    hour >= openHour &&
    hour <= closeHour &&
    minute >= openMinute &&
    minute <= closeMinute
  )
}
