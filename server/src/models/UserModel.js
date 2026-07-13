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

    verificationToken: String,

    verificationTokenExpires: Date,
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("User", userSchema);