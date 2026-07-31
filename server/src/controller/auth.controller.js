import bcrypt from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import {
  sendEmail,
  sendVerificationEmail,
} from "../services/email.service.js";

import {
  generateVerificationToken,
  generateVerificationExpiry,
} from "../util/generateVerificationToken.js";

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
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

    const token = generateVerificationToken();
    const expires = generateVerificationExpiry();

    user.verificationToken = token;
    user.verificationTokenExpires = expires;

    await user.save();

    await sendVerificationEmail(
      user.email,
      user.name,
      token
    );

    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully.",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to send verification email",
    });

  }
};



export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is missing",
      });
    }
console.log("Token from URL:", token);
    const user = await User.findOne({
  verificationToken: token,
});

if (!user) {
  return res.status(400).json({
    success: false,
    message: "Token not found",
  });
}

if (user.verificationTokenExpires <= new Date()) {
  return res.status(400).json({
    success: false,
    message: "Token has expired",
  });
}

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;

    await user.save();

    return res.status(200).json({
  success: true,
  message: "Email verified successfully.",
});

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const testEmail = async (req, res) => {
  try {
    await sendEmail(
      "ibrahimkediramdela2211@gmail.com",
      "CodeTrack Test Email",
      `
      <h1>Hello Ibrahim 👋</h1>
      <p>This is your first email sent from your MERN application.</p>
      `
    );

    res.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to send email",
    });
  }
};
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken =
      generateVerificationToken();

    const verificationTokenExpires =
      generateVerificationExpiry();

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,

      isVerified: false,

      verificationToken,
      verificationTokenExpires,
    });
    console.log("Generated token:", verificationToken);
console.log("Generated expiry:", verificationTokenExpires);
    await sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );

    const userResponse = user.toObject();

    delete userResponse.password;
    delete userResponse.verificationToken;
    delete userResponse.verificationTokenExpires;

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your email.",
      user: userResponse,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });

  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
 const user = await User.findOne({
  email: email.toLowerCase(),
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
    message: "Please verify your email before logging in.",
  });
}
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT
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

    // Remove password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error(error);

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