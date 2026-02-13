import { useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Component to handle session expiration and automatic logout
 * Checks session on route changes and user activity (throttled)
 */
export function SessionExpiryHandler() {
  const { isAuthenticated, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const lastCheckRef = useRef<number>(0);
  const THROTTLE_TIME = 30 * 1000; // Check at most once every 30 seconds

  const handleSessionExpired = useCallback(() => {
    logout();
    toast({
      title: language === "th" ? "เซสชันหมดอายุ" : "Session Expired",
      description:
        language === "th"
          ? "เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง"
          : "Your session has expired. Please login again.",
      variant: "destructive",
    });
    navigate("/login", { replace: true });
  }, [logout, toast, navigate, language]);

  const checkSessionExpiration = useCallback(() => {
    const now = Date.now();
    // Throttle: only check if enough time has passed since last check
    if (now - lastCheckRef.current < THROTTLE_TIME) {
      return;
    }
    lastCheckRef.current = now;

    const sessionData = localStorage.getItem("macfix_auth");
    if (!sessionData) {
      handleSessionExpired();
      return;
    }

    try {
      const session = JSON.parse(sessionData);
      if (!session || !session.loginAt) {
        handleSessionExpired();
        return;
      }

      const loginTime = new Date(session.loginAt).getTime();
      const SESSION_EXPIRY_TIME = 3 * 60 * 60 * 1000; // 3 hours

      if (now - loginTime > SESSION_EXPIRY_TIME) {
        handleSessionExpired();
      }
    } catch {
      handleSessionExpired();
    }
  }, [handleSessionExpired]);

  // Check session on mount and route changes
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;
    checkSessionExpiration();
  }, [isAuthenticated, currentUser, location.pathname, checkSessionExpiration]);

  // Check session on user activity (throttled)
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    // Add event listeners for user activity
    const events = ["mousedown", "keypress", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, checkSessionExpiration, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, checkSessionExpiration);
      });
    };
  }, [isAuthenticated, currentUser, checkSessionExpiration]);

  return null;
}
