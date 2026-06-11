import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to login page since we use passwordless magic links now
    navigate("/login");
  }, [navigate]);

  return null;
}
