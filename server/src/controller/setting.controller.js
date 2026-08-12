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
export const updateProfile = async (req, res) => {

  try {

    const {
      name,
      email,
      phoneNumber,
      location,
    } = req.body;

    if (!name || !email) {

      return res.status(400).json({
        success:false,
        message:"Name, email, and avatar are required"
      });

    }
 if (req.file){
  const avater = req.file.path;
 }
 else{
  const avater = "";
 }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        email,
        phoneNumber,
        location,
        avater,
      },
      { new:true }
    ).select("-password");

    return res.json({
      success:true,
      message:"Profile updated successfully",
      user
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