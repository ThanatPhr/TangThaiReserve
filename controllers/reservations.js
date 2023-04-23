const Reservation = require('../models/Reservation')
const Restaurant = require('../models/Restaurant')
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
    req.body.restaurant = req.params.restaurantId

    const restaurant = await Restaurant.findById(req.params.restaurantId)

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: `No restaurant with the id of ${req.params.restaurantId}`,
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
    console.log(err)
    res.status(500).json({ success: false, message: 'Cannot add Reservation' })
  }
}

exports.updateReservation = async (req, res, next) => {
  try {
    let reservation = await Reservation.findById(req.params.id)

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

    reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({ success: true, data: reservation })
  } catch (err) {
    console.log(err)
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
    const customer = await stripe.customers.create({
      name: req.user.name,
      email: req.user.email,
    })
    // const cardToken = await stripe.tokens.create({
    //   card: {
    //     name: cardName,
    //     number: cardNumber,
    //     exp_month: cardExpMonth,
    //     exp_year: cardExpYear,
    //     cvc: cardCVV,
    //   },
    // })
    // const card = await stripe.customers.createSource(customer.id, {
    //   source: `${cardToken.id}`,
    // })
    // const charge = await stripe.charges.create({
    //   amount: 1000 * 100,
    //   currency: 'thb',
    //   customer: customer.id,
    //   card: card.id,
    // })
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
      amount: 1000 * 100,
      currency: 'thb',
      confirm: true,
      customer: customer.id,
    })

    return res.status(200).json({ success: true, message: paymentIntent })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
