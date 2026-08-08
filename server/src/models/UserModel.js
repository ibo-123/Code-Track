import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,

    email: {
      type: String,
      unique: true,
    },

    password: String,

    role: {
      type: String,
      default: "user",
    },

    avatar: {
      type: String,
      default: "",
    },

    codeforcesHandle: {
      type: String,
      default: "",
    },

    leetcodeUsername: {
      type: String,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationOtp: {
      type: String,
      default: "",
    },

    verificationOtpExpires: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("User", userSchema);