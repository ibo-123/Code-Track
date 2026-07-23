import bcrypt from "bcrypt";
import User from "../models/UserModel.js";

export const changePassword = async (req, res) => {

  try {

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {

      return res.status(400).json({
        success:false,
        message:"All fields are required"
      });

    }

    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if(!isMatch){

      return res.status(400).json({
        success:false,
        message:"Current password is incorrect"
      });

    }

    user.password = await bcrypt.hash(
      newPassword,
      10
    );

    await user.save();

    return res.json({
      success:true,
      message:"Password changed successfully"
    });

  }

  catch(error){

    console.error(error);

    return res.status(500).json({
      success:false,
      message:"Server Error"
    });

  }

};