const { generateToken } = require("../config/jwtToken");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshtoken");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("./emailCtrl");
const uniqid = require("uniqid");
const cartModel = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const payOS = require("../config/payosConfig");
const WebhookLog = require("../models/webhookLog");

// Create user
const createUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const findUserByEmail = await User.findOne({ email });
  const findUserByUsername = await User.findOne({ username });

  if (findUserByEmail) {
    return res.status(400).json({ error: "Email đã tồn tại" });
  }

  if (findUserByUsername) {
    return res.status(400).json({ error: "Username đã tồn tại" });
  }

  const newUser = await User.create({ username, email, password });
  await cartModel.create({ orderBy: newUser._id, products: [] });

  const refreshToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  newUser.refreshToken = refreshToken;
  await newUser.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 3 * 24 * 60 * 60 * 1000,
  });

  return res.status(201).json(newUser);
});

// Login user
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const findUser = await User.findOne({ username });

  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser?._id);
    const accessToken = generateToken(findUser?._id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res.json({ token: accessToken });
  } else {
    throw new Error("Invalid credentials");
  }
});

// Admin login
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const findAdmin = await User.findOne({ email });

  if (findAdmin.role !== "admin") {
    throw new Error("Not authorized, you are not an admin");
  }

  if (findAdmin && findAdmin.isPasswordMatched(password)) {
    const refreshToken = await generateRefreshToken(findAdmin?.id);
    const updateUser = await User.findByIdAndUpdate(
      findAdmin.id,
      { refreshToken: refreshToken },
      { new: true }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });

    res.json({
      _id: findAdmin?._id,
      firstname: findAdmin?.firstname,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      token: generateToken(findAdmin?._id),
    });
  } else {
    throw new Error("Invalid credentials");
  }
});

// Get all users
const getallUser = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find();
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});

// Get a single user
const getaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const getaUser = await User.findById(id);
    res.json({ getaUser });
  } catch (error) {
    throw new Error(error);
  }
});

// Delete a user
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const deleteUser = await User.findByIdAndDelete(id);
    res.json({ deleteUser });
  } catch (error) {
    throw new Error(error);
  }
});

// Handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) {
    throw new Error("No refresh token in cookies");
  }

  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });

  if (!user) {
    throw new Error("No refresh token found in database or user not found");
  }

  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with the refresh token");
    }

    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
});

// Update user address
const updateUserAddress = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    // console.log("User ID:", req.user);
    const { fullname, phone, address } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.fullname = fullname;
    user.phone = phone;

    if (address) {
      const formattedAddress = {
        address: address.address,
        detail_address: address.detail_address,
      };
      user.address = [formattedAddress];
    }

    const updatedUser = await user.save();
    res.status(200).json({
      message: "User address updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user address:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to update user address" });
  }
});

// Block a user
const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const block = await User.findByIdAndUpdate(
      id,
      { isBlocked: true },
      { new: true }
    );
    res.json({ message: "User blocked successfully" });
  } catch (error) {
    throw new Error(error);
  }
});

// Unblock a user
const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const unblock = await User.findByIdAndUpdate(
      id,
      { isBlocked: false },
      { new: true }
    );
    res.json({ message: "User unblocked successfully" });
  } catch (error) {
    throw new Error(error);
  }
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.refreshToken) {
    return res.status(400).json({ message: "No refresh token in cookies" });
  }

  const refreshToken = cookies.refreshToken;
  const user = await User.findOne({ refreshToken });

  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
    return res.sendStatus(204);
  }

  await User.findOneAndUpdate(
    { refreshToken: refreshToken },
    { refreshToken: "" }
  );

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });

  return res.sendStatus(204);
});

// Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  validateMongoDbId(userId);
  try {
    const user = await User.findById(userId);
    res.json(user);
  } catch (error) {
    throw new Error(error);
  }
});

// Update current user
const updateCurrentUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  const fieldsToUpdate = {};

  if (req.body.fullname) fieldsToUpdate.fullname = req.body.fullname;
  if (req.body.email) fieldsToUpdate.email = req.body.email;
  if (req.body.mobile) fieldsToUpdate.mobile = req.body.mobile;
  if (req.body.gender) fieldsToUpdate.gender = req.body.gender;
  if (req.body.address) fieldsToUpdate.address = req.body.address;

  try {
    const updatedUser = await User.findByIdAndUpdate(_id, fieldsToUpdate, {
      new: true,
    });
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    throw new Error("Cập nhật thất bại: " + error.message);
  }
});

const changeUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  validateMongoDbId(id);

  if (!role) {
    return res.status(400).json({ message: "Role is required" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "Role updated successfully", user: updatedUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//Change password
const changePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(_id);
  if (!user) {
    return res.status(404).json({ message: "Người dùng không tồn tại" });
  }
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
  }
  user.password = newPassword;
  await user.save();

  res.json({ message: "Mật khẩu đã được thay đổi thành công" });
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) throw new Error("User not found with this email");

  try {
    const token = await user.createPasswordResetToken();
    await user.save();

    const resetUrl = `Hi, please follow this link to reset your password. This link is valid for 10 minutes. <a href='/reset-password/${token}'>Click here</a>`;

    const data = {
      to: email,
      text: "Hey user",
      subject: "Forgot Password Link",
      html: resetUrl,
    };

    sendEmail(data);
    res.json(token);
  } catch (error) {
    throw new Error(error);
  }
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new Error("Token hết hạn hoặc không hợp lệ");

  user.password = password; // sẽ được mã hóa tự động qua pre('save')
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: "Đặt lại mật khẩu thành công" });
});

const emptyCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const user = await User.findOne({ _id });
    const cart = await Cart.findOneAndDelete({ orderBy: user._id });
    res.json(user.cart);
  } catch (error) {
    throw new Error(error);
  }
});

// Apply coupon
const userCoupon = asyncHandler(async (req, res) => {
  const { coupon, freeship } = req.body;
  const { _id } = req.user;

  let discountAmount = 0;
  let shippingFee = 5000;

  const cart = await cartModel.findOne({ orderBy: _id });
  if (!cart) throw new Error("Cart not found");

  let cartTotal = cart.CartTotal || 0;

  if (coupon) {
    const validateCoupon = await Coupon.findOne({
      name: coupon,
      isActive: true,
      type: "product",
    });

    if (!validateCoupon) throw new Error("Invalid coupon");
    if (new Date(validateCoupon.expiry) < new Date())
      throw new Error("Coupon has expired");
    if (cartTotal < (validateCoupon.minOrderValue || 0)) {
      throw new Error(
        `Order value must be at least ${validateCoupon.minOrderValue} to use this coupon`
      );
    }

    if (validateCoupon.discountType === "percentage") {
      discountAmount = (cartTotal * validateCoupon.discountValue) / 100;
      if (validateCoupon.maxDiscountAmount) {
        discountAmount = Math.min(
          discountAmount,
          validateCoupon.maxDiscountAmount
        );
      }
    } else if (validateCoupon.discountType === "fixed") {
      discountAmount = validateCoupon.discountValue;
      if (validateCoupon.maxDiscountAmount) {
        discountAmount = Math.min(
          discountAmount,
          validateCoupon.maxDiscountAmount
        );
      }
    }
  }

  if (freeship) {
    const validateFreeship = await Coupon.findOne({
      name: freeship,
      isActive: true,
      type: "shipping",
    });

    if (!validateFreeship) throw new Error("Invalid freeship coupon");
    if (new Date(validateFreeship.expiry) < new Date())
      throw new Error("Freeship coupon has expired");

    if (validateFreeship.discountType === "percentage") {
      const discountShip = (shippingFee * validateFreeship.discountValue) / 100;
      shippingFee = Math.max(0, shippingFee - discountShip);
    } else if (validateFreeship.discountType === "fixed") {
      shippingFee = Math.max(0, shippingFee - validateFreeship.discountValue);
    }
  }

  let totalAfterDiscount = cartTotal - discountAmount + shippingFee;
  if (totalAfterDiscount < 0) totalAfterDiscount = 0;

  await cartModel.findOneAndUpdate(
    { orderBy: _id },
    { totalAfterDiscount },
    { new: true }
  );

  res.json({ totalAfterDiscount, discountAmount, shippingFee });
});

// Create order
const createOrder = asyncHandler(async (req, res) => {
  const { COD, couponApplied } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);

  if (!COD) {
    throw new Error("Create cash order failed");
  }

  const user = await User.findById(_id);
  const userCart = await Cart.findOne({ orderBy: user._id });

  let finalAmount = 0;
  if (couponApplied && userCart.totalAfterDiscount) {
    finalAmount = userCart.totalAfterDiscount;
  } else {
    finalAmount = userCart.CartTotal;
  }

  let newOrder = await new Order({
    products: userCart.product,
    paymentIntend: {
      id: uniqid(),
      method: "COD",
      amount: finalAmount,
      status: "Cash on Delivery",
      created: Date.now(),
      currency: "vnd",
    },
    orderBy: user._id,
    orderStatus: "Cash on Delivery",
  }).save();

  let update = userCart.product.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product._id },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    };
  });

  const updated = await Product.bulkWrite(update, {});
  res.json(newOrder);
});

// Get order
const getOrder = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const orders = await Order.find({ orderBy: _id }).populate(
      "products.product"
    );
    res.json(orders);
  } catch (error) {
    throw new Error(error);
  }
});

// Update order status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  validateMongoDbId(orderId);

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    );
    res.json(updatedOrder);
  } catch (error) {
    throw new Error(error);
  }
});

// Create address
const createAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { province, district, ward, street } = req.body;
  validateMongoDbId(_id);

  try {
    const user = await User.findById(_id);
    user.address = { province, district, ward, street };
    await user.save();
    res.json(user.address);
  } catch (error) {
    throw new Error(error);
  }
});

// Create payment
const createPayment = async (req, res) => {
  const { description } = req.body;
  const { _id } = req.user;
  const userCart = await Cart.findOne({ orderBy: _id });

  if (!userCart) {
    return res.status(404).json({ error: "Đơn hàng không tồn tại" });
  }

  let finalAmount = 0;
  if (userCart.totalAfterDiscount && userCart.couponApplied) {
    finalAmount = userCart.totalAfterDiscount;
  } else {
    finalAmount = userCart.CartTotal;
  }

  const orderCode = Date.now();
  userCart.orderCode = orderCode;
  await userCart.save();

  const body = {
    orderCode: orderCode,
    customerName: req.user.firstname || "Khách hàng",
    amount: finalAmount,
    description,
    returnUrl: "/?payment=success",
    cancelUrl: "/carts",
  };

  try {
    const paymentLink = await payOS.createPaymentLink(body);
    res.json(paymentLink);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tạo link thanh toán" });
  }
};

// Webhook handler
const webhookHandler = async (req, res) => {
  await WebhookLog.create({ body: req.body });
  res.status(200).json({ message: "Received" });
};

// Process webhook orders
const processWebhookOrders = async (req, res) => {
  try {
    const logs = await WebhookLog.find({
      "body.data.code": "00",
      processed: false,
    });
    let createdOrders = [];

    for (const log of logs) {
      const orderCode = log.body.data.orderCode;
      const cart = await Cart.findOne({ orderCode }).populate(
        "products.product"
      );
      if (!cart) continue;

      const newOrder = await Order.create({
        products: cart.products.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentIntend: {
          id: cart.orderCode,
          method: "PayOS",
          amount: cart.totalAfterDiscount || cart.CartTotal,
          status: "Paid",
          created: Date.now(),
          currency: log.body.data.currency || "vnd",
        },
        orderBy: cart.orderBy,
        orderStatus: "Paid",
        totalAmount: cart.totalAfterDiscount || cart.CartTotal,
      });

      log.processed = true;
      await log.save();
      await Cart.findByIdAndDelete(cart._id);
      createdOrders.push(newOrder);
    }

    res.json({ message: "Processed webhook logs", createdOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error processing webhook logs" });
  }
};

module.exports = {
  createUser,
  loginUserCtrl,
  updateCurrentUser,
  getallUser,
  getaUser,
  deleteUser,
  blockUser,
  changeUserRole,
  unblockUser,
  handleRefreshToken,
  logoutUser,
  changePassword,
  forgotPasswordToken,
  resetPassword,
  loginAdmin,
  updateUserAddress,
  emptyCart,
  userCoupon,
  createOrder,
  getOrder,
  updateOrderStatus,
  createAddress,
  getCurrentUser,
  createPayment,
  webhookHandler,
  processWebhookOrders,
};
