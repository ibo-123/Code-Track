import bcrypt from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import {
  sendVerificationOtp,
} from "../services/email.service.js";
import {
  generateOtp,
  generateOtpExpiry,
} from "../util/generateOtp.js";

// export const resendVerificationEmail = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required",
//       });
//     }

//     const user = await User.findOne({
//       email: email.toLowerCase(),
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     if (user.isVerified) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is already verified",
//       });
//     }

//     const token = generateVerificationToken();
//     const expires = generateVerificationExpiry();

//     user.verificationToken = token;
//     user.verificationTokenExpires = expires;

//     await user.save();

//     await sendVerificationEmail(
//       user.email,
//       user.name,
//       token
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Verification email sent successfully.",
//     });

//   } catch (error) {

//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to send verification email",
//     });

//   }
// };



// export const verifyEmail = async (req, res) => {
//   try {
//     const { token } = req.query;

//     if (!token) {
//       return res.status(400).json({
//         success: false,
//         message: "Verification token is missing",
//       });
//     }
// console.log("Token from URL:", token);
//     const user = await User.findOne({
//   verificationToken: token,
// });

// if (!user) {
//   return res.status(400).json({
//     success: false,
//     message: "Token not found",
//   });
// }

// if (user.verificationTokenExpires <= new Date()) {
//   return res.status(400).json({
//     success: false,
//     message: "Token has expired",
//   });
// }

//     user.isVerified = true;
//     user.verificationToken = null;
//     user.verificationTokenExpires = null;

//     await user.save();

//     return res.status(200).json({
//   success: true,
//   message: "Email verified successfully.",
// });

//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };
//  export const testEmail = async (req, res) => {
//   try {
//     await sendEmail(
//       "ibrahimkediramdela2211@gmail.com",
//       "CodeTrack Test Email",
//       `
//       <h1>Hello Ibrahim 👋</h1>
//       <p>This is your first email sent from your MERN application.</p>
//       `
//     );

//     res.json({
//       success: true,
//       message: "Email sent successfully",
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to send email",
//     });
//   }
// };
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const otp = generateOtp();

    const otpExpires = generateOtpExpiry();

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,

      isVerified: false,

      verificationOtp: otp,
      verificationOtpExpires: otpExpires,

      otpAttempts: 0,
    });

    try {
      await sendVerificationOtp(
        user.email,
        user.name,
        otp
      );
    } catch (error) {
      // Remove user if email couldn't be sent
      await User.findByIdAndDelete(user._id);

      console.error(
        "❌ Verification OTP failed:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send verification code. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Verification code sent to your email.",
      email: user.email,
    });
  } catch (error) {
    console.error(
      "❌ Register error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    if (!user.verificationOtp) {
      return res.status(400).json({
        success: false,
        message:
          "No verification code found. Please request a new code.",
      });
    }

    if (
      !user.verificationOtpExpires ||
      user.verificationOtpExpires < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. Please request a new code.",
      });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new code.",
      });
    }

    if (otp.toString() !== user.verificationOtp) {
      user.otpAttempts += 1;

      await user.save();

      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
        attemptsRemaining:
          Math.max(0, 5 - user.otpAttempts),
      });
    }

    // OTP is correct
    user.isVerified = true;

    // Delete OTP after successful verification
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    user.otpAttempts = 0;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Email verified successfully. You can now login.",
    });
  } catch (error) {
    console.error(
      "❌ OTP verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const resendVerificationOtp = async (
  req,
  res
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    const otp = generateOtp();

    const otpExpires = generateOtpExpiry();

    user.verificationOtp = otp;
    user.verificationOtpExpires = otpExpires;
    user.otpAttempts = 0;

    await user.save();

    try {
      await sendVerificationOtp(
        user.email,
        user.name,
        otp
      );
    } catch (error) {
      console.error(
        "❌ Resend OTP failed:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send verification code",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "A new verification code has been sent.",
    });
  } catch (error) {
    console.error(
      "❌ Resend OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email before logging in.",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    const userResponse = user.toObject();

    delete userResponse.password;
    delete userResponse.verificationOtp;
    delete userResponse.verificationOtpExpires;
    delete userResponse.otpAttempts;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error(
      "❌ Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};