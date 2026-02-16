import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * Component to handle session expiration and automatic logout
 * Checks session on route changes and user activity (throttled)
 */
export function SessionExpiryHandler() {
  const { isAuthenticated, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const [showExpiryDialog, setShowExpiryDialog] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const lastCheckRef = useRef<number>(0);
  const THROTTLE_TIME = 30 * 1000; // Check at most once every 30 seconds

  const handleSessionExpired = useCallback(() => {
    setShowExpiryDialog(true);
    setCountdown(3);
  }, []);

  const handleRedirectToLogin = useCallback(() => {
    logout();
    setShowExpiryDialog(false);
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  // Auto-redirect to login after showing dialog for 3 seconds with countdown
  useEffect(() => {
    if (showExpiryDialog) {
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            handleRedirectToLogin();
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // Update countdown every second

      return () => clearInterval(countdownInterval);
    }
  }, [showExpiryDialog, handleRedirectToLogin]);

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

  return (
    <>
      <Dialog 
        open={showExpiryDialog} 
        onOpenChange={(open) => {
          // Prevent closing dialog by clicking outside or pressing ESC
          // Only allow closing through the button
          if (!open) {
            handleRedirectToLogin();
          }
        }}
        modal={true}
      >
        <DialogContent 
          className="sm:max-w-[425px]" 
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <DialogTitle className="text-xl">
                {language === "th" ? "เซสชันหมดอายุ" : "Session Expired"}
              </DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-base">
              {language === "th"
                ? "เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง"
                : "Your session has expired. Please login again."}
            </DialogDescription>
            {countdown > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {language === "th"
                  ? `กำลังเปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบในอีก ${countdown} วินาที...`
                  : `Redirecting to login page in ${countdown} second${countdown !== 1 ? 's' : ''}...`}
              </p>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={handleRedirectToLogin}
              className="w-full sm:w-auto"
              variant="default"
              autoFocus
            >
              {language === "th" ? "ไปหน้าเข้าสู่ระบบ" : "Go to Login"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
