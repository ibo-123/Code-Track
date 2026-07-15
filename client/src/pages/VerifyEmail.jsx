import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { verifyEmailToken } from "../services/authService";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token missing. Please check your email for the verification link.");
        return;
      }

      setStatus("loading");
      try {
        const res = await verifyEmailToken(token);
        setStatus("success");
        setMessage(res.message || "Email verified successfully. Redirecting to login...");
        toast.success(res.message || "Email verified successfully");

        setTimeout(() => navigate("/login"), 2500);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Verification failed";
        setStatus("error");
        setMessage(msg);
        toast.error(msg);
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="max-w-2xl mx-auto mt-28 p-6 bg-white rounded-2xl shadow-md text-center">
      {status === "loading" && <div className="py-8">Verifying your email…</div>}

      {status === "success" && (
        <div className="py-8">
          <h2 className="text-lg font-semibold">Email verified</h2>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </div>
      )}

      {status === "error" && (
        <div className="py-8">
          <h2 className="text-lg font-semibold text-destructive">Verification failed</h2>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </div>
      )}

      {status === "idle" && (
        <div className="py-8">
          <h2 className="text-lg font-semibold">Verify your email</h2>
          <p className="mt-2 text-sm text-muted-foreground">Checking for a verification token…</p>
        </div>
      )}
    </div>
  );
}

export default VerifyEmail;
