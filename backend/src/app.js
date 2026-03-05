// src/app.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const { notFound, errorHandler } = require("./middlewares/errorHandler");

// routes
const authRouter = require("./routes/authRoute");
const productRouter = require("./routes/productRoute");
const blogRouter = require("./routes/blogRoute");
const categoryRouter = require("./routes/categoryRoute");
const exerciseRouter = require("./routes/exerciseRoute");
const orderRouter = require("./routes/orderRoute");
const cartRouter = require("./routes/cartRoute");
const couponRouter = require("./routes/couponRoute");
const addressRouter = require("./routes/addressRoute");
const reviewRouter = require("./routes/reviewRoute");

const app = express();

// CORS 
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.use("/api/user", authRouter);
app.use("/api/product", productRouter);
app.use("/api/blog", blogRouter);

// ⚠️ Bạn đang mount category 2-3 lần. Chọn 1 chuẩn thôi:
app.use("/api/categories", categoryRouter); // gợi ý dùng plural
// app.use("/api/category", categoryRouter); // nếu bạn muốn singular thì dùng cái này và bỏ cái trên

app.use("/api/exercise", exerciseRouter);
app.use("/api/order", orderRouter);
app.use("/api/cart", cartRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/address", addressRouter);
app.use("/api/reviews", reviewRouter);

// error handlers (luôn để cuối)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
