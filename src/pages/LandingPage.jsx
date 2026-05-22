import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, UserPlus } from "lucide-react";
import { callFunction } from "../lib/supabase";
import { toast } from "react-hot-toast";
import KyndrylLogo from "../assets/kyndryl.png";
import "../pages/Screen/Screen.css";
import { speak, stopAllSpeech } from "../lib/tts";

export default function LandingPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Auto-capture countdown state
  const [countdown, setCountdown] = useState(5);
  const [autoCaptureActive, setAutoCaptureActive] = useState(false);

  // =========================
  // START CAMERA
  // =========================
  const startCamera = useCallback(async () => {
    try {
      setCameraError("");
      setCameraReady(false);

      // STOP OLD STREAM
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // START CAMERA WITH ROBUST FALLBACK FOR IOS/IPAD DEVICES
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err) {
        console.warn("High-res video constraints failed, falling back to standard video query...", err);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Native autoplay/playsinline/muted handles rendering perfectly on iOS.
        // We run a safe play() call to trigger it programmatically if possible.
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn("Muted programmatic play failed, falling back to native HTML5 autoplay", e);
        }
      }

      setCameraReady(true);
    } catch (err) {
      console.error("CAMERA ERROR:", err);

      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied"
          : "Unable to access camera",
      );
    }
  }, []);

  // =========================
  // STOP CAMERA
  // =========================
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // =========================
  // INIT CAMERA
  // =========================
  useEffect(() => {
    startCamera();

    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    speak("Scan your name");
    return () => {
      stopAllSpeech();
    };
  }, []);

  // =========================
  // CAPTURE IMAGE
  // =========================
  const captureImage = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.videoWidth === 0) {
        throw new Error("Camera not ready");
      }

      // DRAW IMAGE
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // IMAGE TO BASE64
      const imageData = canvas.toDataURL("image/jpeg", 0.9);

      if (!eventId) {
        throw new Error("Missing Event ID");
      }

      // =========================
      // CALL EDGE FUNCTION
      // =========================
      const result = await callFunction("scan-id-card", {
        imageBase64: imageData,
        eventId,
      });

      console.log("SCAN RESULT:", result);

      if (result?.error) {
        throw new Error(result.error);
      }

      // =========================
      // USER FOUND
      // =========================
      if (result?.userFound && result?.user) {
        toast.success(`Welcome ${result.user.username}`);

        // CREATE SESSION
        const session = await callFunction("create-session", {
          eventCode: eventId,

          // IMPORTANT
          name: result.user.username,

          company: result.user.company || "",

          designation: result.user.designation || "",

          email: result.user.email || "",
        });

        console.log("SESSION:", session);

        if (session?.sessionId) {
          stopCamera();

          navigate(`/sector/${session.sessionId}`, {
            state: {
              questions: session.questions || [],
              userName: result.user.username,
            },
          });

          return;
        }

        throw new Error("Session creation failed");
      }

      // =========================
      // USER NOT FOUND
      // =========================
      const extractedName = result?.extractedName || "";

      toast.error(
        extractedName ? `${extractedName} not found` : "User not found",
      );

      navigate(`/register/${eventId}`, {
        state: {
          prefill: {
            name: extractedName,
          },
        },
      });
    } catch (err) {
      console.error("SCAN ERROR:", err);

      toast.error(err.message || "Scanning failed");
    } finally {
      setLoading(false);
    }
  };

  // Start auto-capture countdown when camera is ready and active
  useEffect(() => {
    if (cameraReady && !loading && !cameraError) {
      setCountdown(10);
      setAutoCaptureActive(true);
    } else {
      setAutoCaptureActive(false);
    }
  }, [cameraReady, loading, cameraError]);

  // Handle countdown interval decrement
  useEffect(() => {
    let interval;
    if (autoCaptureActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [autoCaptureActive, countdown]);

  // Trigger capture automatically at 0
  useEffect(() => {
    if (autoCaptureActive && countdown === 0) {
      setAutoCaptureActive(false);
      captureImage();
    }
  }, [countdown, autoCaptureActive]);

  return (
    <div
      className="min-vh-100 d-flex flex-column overflow-x-hidden position-relative bg-light"
      style={{
        minHeight: "100dvh",
      }}
    >
      {/* BACKGROUND */}
      <div className="landing-grid"></div>

      {/* TOP BAR */}
      <div className="container-fluid px-4 px-lg-5 py-4" style={{ zIndex: 20 }}>
        <div className="d-flex align-items-center justify-content-between">
          <motion.img
            initial={{
              opacity: 0,
              x: -30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            src={KyndrylLogo}
            alt="Kyndryl"
            className="landing-logo"
          />
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-grow-1 container-fluid px-0">
        <div className="row g-0 h-100">
          {/* LEFT SIDE */}
          <div className="col-md-5 d-flex align-items-center p-3 p-md-4 p-lg-5 landing-left-col">
            <motion.div
              initial={{
                opacity: 0,
                y: 40,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="w-100"
            >
              <div className="landing-line mb-3 mb-md-4"></div>

              <h1 className="landing-title">
                60-Second <span>Challenge</span>
              </h1>

              <p className="landing-subtitle">
                Scan your name to begin the AI leadership
                experience.
              </p>

              <div className="row g-3 mt-3">
                <div className="col-12">
                  <div className="info-card">
                    <div className="info-dot"></div>
                    Position your name badge clearly
                  </div>
                </div>

                <div className="col-12">
                  <div className="info-card">
                    <div className="info-dot"></div>
                    Avoid reflections and poor lighting
                  </div>
                </div>

                <div className="col-12">
                  <div className="info-card">
                    <div className="info-dot"></div>
                    Session starts automatically after verification
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT SIDE */}
          <div className="col-md-7 d-flex align-items-center justify-content-center p-3 p-md-4 p-lg-5 bg-dark landing-right-col">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.94,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="camera-shell w-100"
              style={{
                maxWidth: "620px",
              }}
            >
              {/* HEADER */}
              <div className="camera-header">
                <div className="d-flex align-items-center gap-2">
                  <div className="camera-dot bg-danger"></div>
                  <div className="camera-dot bg-warning"></div>
                  <div className="camera-dot bg-success"></div>
                </div>

                <div className="camera-status">
                  {cameraReady ? "CAMERA ACTIVE" : "INITIALIZING"}
                </div>
              </div>

              {/* CAMERA AREA */}
              <div className="camera-wrapper">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                />

                {/* AUTO-CAPTURE COUNTDOWN BANNER */}
                <AnimatePresence>
                  {autoCaptureActive && countdown > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.8 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="position-absolute start-50 translate-middle-x text-white rounded-pill px-4 py-2 d-flex align-items-center gap-2"
                      style={{
                        top: '24px',
                        zIndex: 30,
                        background: 'linear-gradient(135deg, #ff4d3d, #ff1f1f)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: '0 8px 30px rgba(255, 77, 61, 0.45)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          boxShadow: '0 0 10px #fff',
                          animation: 'pulse 1s infinite alternate'
                        }}
                      />
                      <span className="fw-bold" style={{ fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Auto-Capturing in <span style={{ fontSize: '1.15rem', fontWeight: 900 }}>{countdown}s</span>
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* SCAN FRAME */}
                <div className="scan-frame">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>

                  {cameraReady && !loading && (
                    <motion.div
                      animate={{
                        top: ["0%", "100%", "0%"],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="scan-line"
                    />
                  )}
                </div>

                {/* LOADING */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      exit={{
                        opacity: 0,
                      }}
                      className="camera-overlay"
                    >
                      <div className="text-center">
                        <div
                          className="spinner-border text-danger"
                          style={{
                            width: "4rem",
                            height: "4rem",
                          }}
                        />

                        <div className="scan-text mt-4">ANALYZING IDENTITY</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CAMERA ERROR */}
                {cameraError && (
                  <div className="camera-overlay">
                    <div className="text-center text-white">
                      <Camera size={60} className="mb-4 text-danger" />

                      <h4 className="fw-bold mb-3">Camera Access Failed</h4>

                      <p className="mb-4 opacity-75">{cameraError}</p>

                      <button
                        onClick={startCamera}
                        className="btn btn-light rounded-pill px-5"
                      >
                        Retry Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* BUTTONS */}
              <div className="camera-actions">
                <motion.button
                  whileHover={{
                    scale: 1.03,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  onClick={captureImage}
                  disabled={!cameraReady || loading}
                  className="capture-btn"
                >
                  {loading ? "IDENTIFYING..." : "CAPTURE & START"}
                </motion.button>

                <button
                  onClick={() => navigate(`/register/${eventId}`)}
                  className="manual-btn"
                >
                  <UserPlus size={18} />
                  Manual Registration
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* HIDDEN CANVAS */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
