export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateOtpExpiry = () => {
  const expiry = new Date();

  // OTP expires after 10 minutes
  expiry.setMinutes(expiry.getMinutes() + 10);

  return expiry;
};