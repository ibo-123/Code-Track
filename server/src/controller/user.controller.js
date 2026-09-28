import User from "../models/UserModel.js";

const publicUserSelect =
  "-password -verificationOtp -verificationOtpExpires";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(publicUserSelect);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      codeforcesHandle,
      phone,
      phoneNumber,
      location,
    } = req.body;

    const updateData = {};

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (typeof codeforcesHandle === "string") {
      updateData.codeforcesHandle = codeforcesHandle.trim() || null;
    }

    const nextPhone =
      typeof phoneNumber === "string"
        ? phoneNumber
        : typeof phone === "string"
          ? phone
          : undefined;

    if (typeof nextPhone === "string") {
      updateData.phoneNumber = nextPhone.trim();
    }

    if (typeof location === "string") {
      updateData.location = location.trim();
    }

    if (req.file) {
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      updateData.avatar = avatarPath;
      updateData.avater = avatarPath;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select(publicUserSelect);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
