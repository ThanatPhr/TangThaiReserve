const Restaurant = require('../models/Restaurant')

exports.getRestaurants = async (req, res, next) => {
  let query
  const reqQuery = { ...req.query }
  const removeFields = ['select', 'sort', 'page', 'limit']

  removeFields.forEach((param) => delete reqQuery[param])

  let queryStr = JSON.stringify(reqQuery)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`)

  query = Restaurant.find(JSON.parse(queryStr)).populate('reservations')

  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ')
    query = query.select(fields)
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ')
    query = query.sort(sortBy)
  } else {
    query = query.select('-createdAt')
  }

  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 25
  const startIndex = (page - 1) * limit
  const endIndex = page * limit

  try {
    const total = await Restaurant.countDocuments()
    query = query.skip(startIndex).limit(limit)

    const restaurants = await query

    const pagination = {}

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      }
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      }
    }

    res.status(200).json({
      success: true,
      count: restaurants.length,
      pagination,
      data: restaurants,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      data: error.message,
    })
  }
}

exports.getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        data: 'Restaurant not found',
      })
    }
    res.status(200).json({
      success: true,
      data: restaurant,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      data: error.message,
    })
  }
}

exports.createRestaurant = async (req, res, next) => {
  try {
    if (!isValidCloseTime(req.body.openTime, req.body.closeTime)) {
      return res.status(400).json({
        success: false,
        data: 'Invalid Time',
      })
    }

    const restaurant = await Restaurant.create(req.body)
    res.status(201).json({
      success: true,
      data: restaurant,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      data: error.message,
    })
  }
}

exports.updateRestaurant = async (req, res, next) => {
  try {
    if (!isValidCloseTime(req.body.openTime, req.body.closeTime)) {
      return res.status(400).json({
        success: false,
        data: 'Invalid Time',
      })
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        data: 'Restaurant not found',
      })
    }
    res.status(200).json({
      success: true,
      data: restaurant,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      data: error.message,
    })
  }
}

exports.deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        data: 'Restaurant not found',
      })
    }

    restaurant.remove()
    res.status(200).json({ success: true, data: {} })
  } catch (error) {
    res.status(400).json({
      success: false,
      data: error.message,
    })
  }
}

function isValidCloseTime(openTime, closeTime) {
  const openHour = parseInt(openTime.split(':')[0])
  const openMinute = parseInt(openTime.split(':')[1])
  const closeHour = parseInt(closeTime.split(':')[0])
  const closeMinute = parseInt(closeTime.split(':')[1])
  if (
    openHour >= 24 ||
    openMinute >= 60 ||
    openHour < 0 ||
    openMinute < 0 ||
    closeHour >= 24 ||
    closeMinute >= 60 ||
    closeHour < 0 ||
    closeMinute < 0
  ) {
    return false
  }
  return (
    openHour < closeHour || (openHour == closeHour && openMinute < closeMinute)
  )
}
