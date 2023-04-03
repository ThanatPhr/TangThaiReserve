const User = require("../models/User.js");

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
};

exports.register = async (req, res, next) => {
  const { name, email, tel, password, role } = req.body;

  try {
    const user = await User.create({
      name,
      email,
      tel,
      password,
      role,
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.log(err.stack);
    res.status(400).json({ success: false });
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, msg: "Please provide an email and password" });
  }

  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(400).json({ success: false, msg: "Invalid credentials" });
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(400).json({ success: false, msg: "Invalid credentials" });
  }

  sendTokenResponse(user, 200, res);
};

exports.logout = async (req, res, next) => {
  res
    .cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    })
    .status(200)
    .json({
      success: true,
      data: {},
    });
};
