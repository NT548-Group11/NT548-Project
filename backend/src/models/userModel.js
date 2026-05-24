const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcrypt"); // For password hashing
const crypto = require("crypto"); // For generating secure tokens
// Declare the Schema of the Mongo model
const addressSchema = new mongoose.Schema(
  {
    address: { type: String, required: true }, // Địa chỉ đã chọn
    detail_address: { type: String, required: true }, // Địa chỉ cụ thể
  },
  { _id: false }
);
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    cart: {
      type: Array,
      default: [],
    },
    address: [addressSchema],
    gender: {
      type: String,
      default: "other",
    },
    avatar: {
      type: String,
      default:null,
    },
    refreshToken: {
      type: String,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // Token valid for 30 minutes
  return resetToken;
};
//Export the model
module.exports = mongoose.model("User", userSchema);
