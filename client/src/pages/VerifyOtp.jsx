
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

import {
  verifyOtp,
  resendOtp,
} from "../services/authService";

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const [countdown, setCountdown] = useState(60);

  // Redirect if user opens the page directly
  useEffect(() => {
    if (!email) {
      toast.error("Email information is missing.");
      navigate("/register");
    }
  }, [email, navigate]);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (e) => {
    const value = e.target.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return;
    }

    // Maximum 6 digits
    if (value.length > 6) {
      return;
    }

    setOtp(value);
    setError("");
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      const message = "Please enter the 6-digit OTP.";

      setError(message);
      toast.error(message);

      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await verifyOtp({
        email,
        otp,
      });

      toast.success(
        response.message || "Email verified successfully!"
      );

      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Invalid or expired OTP.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) {
      return;
    }

    setResending(true);
    setError("");

    try {
      const response = await resendOtp({
        email,
      });

      toast.success(
        response.message || "A new OTP has been sent."
      );

      setOtp("");
      setCountdown(60);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to resend OTP.";

      setError(message);
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">
          Verify your email
        </h1>

        <p className="text-sm text-muted-foreground mt-2">
          We sent a 6-digit verification code to
        </p>

        <p className="font-medium mt-1">
          {email}
        </p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-5">
        <div>
          <label className="block text-sm mb-2">
            Verification code
          </label>

          <Input
            value={otp}
            onChange={handleOtpChange}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            className="text-center text-2xl tracking-[0.5em]"
            disabled={loading}
            autoFocus
          />
        </div>

        <Button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full"
        >
          {loading ? "Verifying..." : "Verify Email"}
        </Button>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?
        </p>

        <Button
          type="button"
          variant="link"
          onClick={handleResend}
          disabled={countdown > 0 || resending}
          className="mt-1"
        >
          {resending
            ? "Sending..."
            : countdown > 0
            ? `Resend OTP in ${countdown}s`
            : "Resend OTP"}
        </Button>
      </div>

      <div className="text-center mt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/register")}
        >
          ← Back to Register
        </Button>
      </div>
    </div>
  );
}

export default VerifyOtp;
