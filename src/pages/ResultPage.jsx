import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { callFunction } from "../lib/supabase";
import { toast } from "react-hot-toast";
import KyndrylLogo from "../assets/kyndryl.png";
import { DoorOpen, ArrowRight, CheckCircle } from "lucide-react";

export default function ResultPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [showBackupButton, setShowBackupButton] = useState(false);

  const hasSpoken = useRef(false);
  const hasTriggeredDoor = useRef(false);

  // 10 SECONDS DELAY FOR BACKUP BUTTON
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowBackupButton(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [loading]);

  // SPEECH
  const speak = (text) => {
    const synth = window.speechSynthesis;

    if (!synth) return;

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 0.95;
    utterance.pitch = 1;

    synth.cancel();
    synth.speak(utterance);
  };

  // AUTOMATIC DOOR TRIGGER
  const triggerDoorAuto = async () => {
    if (hasTriggeredDoor.current) return;
    hasTriggeredDoor.current = true;

    const espIp = import.meta.env.VITE_ESP32_IP || "192.168.0.198";
    const espUrl = espIp.startsWith("http") ? `${espIp}/open` : `http://${espIp}/open`;

    // Setup abort controller for a 3-second timeout to avoid hanging the app if ESP32 is offline
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    console.log(`[ESP32] Attempting to trigger Door at: ${espUrl}`);

    try {
      await fetch(espUrl, {
        method: "GET",
        mode: "no-cors", // Opaque request avoids CORS errors since we only need to trigger the endpoint
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log("[ESP32] Door Open Trigger Sent Successfully!");
    } catch (espError) {
      clearTimeout(timeoutId);
      if (espError.name === "AbortError") {
        console.warn(`[ESP32] Trigger Timeout (3s) at ${espUrl}. Device may be offline.`);
      } else {
        console.error(
          `[ESP32] Trigger Failed at ${espUrl}. Error:`, espError,
          "\n\nTroubleshooting steps:\n" +
          "1. Verify that the ESP32 is powered on and connected to the same Wi-Fi network.\n" +
          "2. Double check if the ESP32's current IP address matches the configuration.\n" +
          "3. You can set the custom IP using VITE_ESP32_IP in your .env file."
        );
      }
    }
  };

  // MANUAL BACKUP TRIGGER
  const handleManualTrigger = async () => {
    setTriggering(true);

    const espIp = import.meta.env.VITE_ESP32_IP || "192.168.0.198";
    const espUrl = espIp.startsWith("http") ? `${espIp}/open` : `http://${espIp}/open`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    console.log(`[ESP32 Manual] Sending backup trigger to: ${espUrl}`);

    try {
      await fetch(espUrl, {
        method: "GET",
        mode: "no-cors",
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      toast.success("Backup open signal sent!");
      console.log("[ESP32 Manual] Backup Trigger Sent Successfully!");
    } catch (espError) {
      clearTimeout(timeoutId);
      toast.error("Failed to trigger door. Check connection.");
      console.error("[ESP32 Manual] Backup Trigger Failed:", espError);
    } finally {
      setTriggering(false);
    }
  };

  // FETCH RESULT ON LOAD
  useEffect(() => {
    async function fetchResult() {
      try {
        const result = await callFunction("get-result", {
          sessionId,
        });

        setData(result);

        // Auto trigger door opening
        await triggerDoorAuto();

        // SPEAK
        if (result?.user?.name && !hasSpoken.current) {
          hasSpoken.current = true;

          speak(
            `Thank you ${result.user.name} for sharing your perspective`
          );
        }

      } catch (error) {
        console.error(error);
        toast.error("Failed to load result");
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        Result Not Found
      </div>
    );
  }

  const { user } = data;

  return (
    <div
      className="container-fluid min-vh-100 p-0 overflow-hidden position-relative d-flex align-items-center justify-content-center"
      style={{
        background: "#ffffff",
        minHeight: "100dvh"
      }}
    >
      {/* Top Left Logo */}
      <div className="position-absolute top-0 start-0 p-4 p-lg-5" style={{ zIndex: 20 }}>
        <img
          src={KyndrylLogo}
          alt="Kyndryl Logo"
          className="img-fluid"
          style={{ width: "160px" }}
        />
      </div>

      {/* Decorative Red Skewed Lines Pattern from StartPage */}
      <div
        className="position-absolute top-0 end-0 h-100 d-none d-lg-block"
        style={{
          width: "220px",
          opacity: 0.3,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              right: `${i * 22}px`,
              top: "-10%",
              width: "1px",
              height: "130%",
              background: "#ff4d3d",
              transform: "skewX(-25deg)",
            }}
          />
        ))}
      </div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="position-relative z-2 text-center px-4"
        style={{ maxWidth: "600px" }}
      >
        {/* Animated Check Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="mb-4 d-inline-block"
        >
          <div
            className="d-flex align-items-center justify-content-center rounded-circle mx-auto"
            style={{
              width: "100px",
              height: "100px",
              background: "rgba(255, 77, 61, 0.1)",
              border: "2px solid #ff4d3d"
            }}
          >
            <CheckCircle size={48} color="#ff4d3d" />
          </div>
        </motion.div>

        {/* Heading */}
        <h1
          className="fw-light lh-1 mb-2"
          style={{
            fontSize: "clamp(2.2rem, 5vw, 4rem)",
            color: "#ff4d3d",
            letterSpacing: "-2px",
          }}
        >
          THANK YOU!
        </h1>

        <h2
          className="fw-bold mb-4"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 3rem)",
            color: "#2b2b2b",
            letterSpacing: "-1.5px",
          }}
        >
          {user.name}
        </h2>

        <p
          className="mb-5 text-muted mx-auto"
          style={{
            fontSize: "1.15rem",
            lineHeight: "1.7",
            maxWidth: "480px"
          }}
        >
          Thank you for sharing your perspective and completing the 60-Second CIO Challenge. Your session has been successfully recorded.
        </p>

        {/* ACTION BUTTONS */}
        <div className="d-flex flex-column align-items-center gap-3">
          {/* Primary Action: Return to Home */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/start/${data.eventCode || "etcio2026"}`)}
            className="btn btn-lg rounded-pill px-5 py-3 fw-bold d-inline-flex align-items-center justify-content-center gap-2"
            style={{
              background: "#2b2b2b",
              color: "#fff",
              border: "none",
              boxShadow: "0 8px 24px rgba(43, 43, 43, 0.15)",
              fontSize: "1.1rem",
              letterSpacing: "0.5px",
              minWidth: "260px",
              transition: "all 0.3s ease"
            }}
          >
            RETURN TO HOME <ArrowRight size={18} />
          </motion.button>

          {/* Backup Action: Open Door (Appears after 10 seconds) */}
          <AnimatePresence>
            {showBackupButton && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="pt-2"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleManualTrigger}
                  disabled={triggering}
                  className="btn btn-lg rounded-pill px-5 py-3 fw-bold d-inline-flex align-items-center justify-content-center gap-2"
                  style={{
                    background: triggering ? "#b3b3b3" : "#ff4d3d",
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 8px 24px rgba(255, 77, 61, 0.2)",
                    fontSize: "1.1rem",
                    letterSpacing: "0.5px",
                    minWidth: "260px",
                    transition: "all 0.3s ease"
                  }}
                >
                  <DoorOpen size={20} />
                  {triggering ? "OPENING DOOR..." : "OPEN DOOR (BACKUP)"}
                </motion.button>
                <div className="mt-2 text-muted text-uppercase fw-bold text-center" style={{ fontSize: "0.75rem", letterSpacing: "1px", color: "#8a8a8a" }}>
                  *Click if the showcase door did not open automatically
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}