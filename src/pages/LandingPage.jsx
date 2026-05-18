import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, UserPlus } from "lucide-react";
import { callFunction } from "../lib/supabase";
import { toast } from "react-hot-toast";
import KyndrylLogo from "../assets/kyndryl.png";
import '../pages/Screen/Screen.css';

export default function LandingPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // =========================
  // START CAMERA
  // =========================
  const startCamera = useCallback(async () => {
    try {
      setCameraError("");
      setCameraReady(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current.play();
              resolve();
            } catch (e) {
              console.error(e);
            }
          };
        });
      }
      setCameraReady(true);
    } catch (err) {
      console.error("CAMERA ERROR:", err);
      setCameraError(err.name === "NotAllowedError" ? "Camera permission denied" : "Unable to access camera");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (cameraReady) {
      const timeout = setTimeout(() => {
        speak("Please scan your ID to get started");
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [cameraReady]);

  // =========================
  // VOICE FEEDBACK
  // =========================
  const speak = (text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    
    // Helper to perform actual speech
    const performSpeech = (availableVoices) => {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Strictly prefer high-quality humanistic FEMALE voices
      const preferredVoice = availableVoices.find(v => {
        const name = v.name.toLowerCase();
        return v.lang.startsWith('en') && (
          name.includes('female') || 
          name.includes('samantha') || 
          name.includes('zira') || 
          name.includes('victoria') || 
          name.includes('tessa') || 
          name.includes('moira') ||
          (name.includes('google') && name.includes('english') && !name.includes('male'))
        );
      }) || availableVoices.find(v => v.name.toLowerCase().includes('female'))
         || availableVoices.find(v => v.lang.startsWith('en-US') && !v.name.toLowerCase().includes('male'))
         || availableVoices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      synth.speak(utterance);
    };

    let voices = synth.getVoices();
    if (voices.length > 0) {
      performSpeech(voices);
    } else {
      // Wait for voices to load (common in Chrome)
      synth.onvoiceschanged = () => {
        const updatedVoices = synth.getVoices();
        performSpeech(updatedVoices);
        synth.onvoiceschanged = null; // Clean up
      };
    }
  };

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

      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL("image/jpeg", 0.9);

      if (!eventId) throw new Error("Missing Event ID.");

      const result = await callFunction("scan-id-card", {
        imageBase64: imageData,
        eventId,
      });

      if (result?.error) throw new Error(result.error);

      if (result?.userFound && result?.user) {
        toast.success(`Welcome ${result.user.name}`);
        speak(`Welcome ${result.user.name}`);

        const session = await callFunction("create-session", {
          eventCode: eventId,
          name: result.user.name,
          company: result.user.company,
          designation: result.user.designation,
          email: result.user.email,
        });

        if (session?.sessionId) {
          stopCamera();
          navigate(`/sector/${session.sessionId}`, {
            state: { questions: session.questions || [] },
          });
          return;
        }
        throw new Error("Session creation failed");
      }

      const extractedName = result?.extractedName || "";
      const voiceMsg = extractedName 
        ? `Sorry ${extractedName}, we couldn't find your name. Please register.`
        : "Sorry, we couldn't find your name. Please register manually.";
      
      toast(result?.message || "User not found. Please register manually.");
      speak(voiceMsg);

      navigate(`/register/${eventId}`, {
        state: { prefill: { name: extractedName } },
      });
    } catch (err) {
      console.error("SCAN ERROR:", err);
      toast.error(err.message || "Scanning failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column overflow-x-hidden position-relative bg-light" style={{ minHeight: "100dvh" }}>
      {/* BACKGROUND GRID */}
      <div className="landing-grid"></div>

      {/* TOP NAVBAR - Full Width */}
      <div className="container-fluid px-4 px-lg-5 py-4" style={{ zIndex: 20 }}>
        <div className="d-flex align-items-center justify-content-between">
          <motion.img
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            src={KyndrylLogo}
            alt="Kyndryl"
            className="landing-logo"
          />
        </div>
      </div>

      {/* MAIN FULL-WIDTH 2-COLUMN LAYOUT */}
      <div className="flex-grow-1 container-fluid px-0">
        <div className="row g-0 h-100">

          {/* LEFT COLUMN - Content */}
          <div className="col-md-5 d-flex align-items-center p-3 p-md-4 p-lg-5">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-100"
            >
              <div className="landing-line mb-3 mb-md-4"></div>

              <h1 className="landing-title">
                60-Second <span>Challenge</span>
              </h1>

              <p className="landing-subtitle">
                Scan your employee ID card to begin the AI leadership
                experience. The system will identify your profile and
                personalize the journey instantly.
              </p>

              {/* INFO CARDS */}
              <div className="row g-2 g-md-3 mt-2 mt-md-3 mt-lg-4">
                <div className="col-12">
                  <div className="info-card">
                    <div className="info-dot"></div>
                    Position your ID card clearly inside the scanning frame
                  </div>
                </div>
                <div className="col-12">
                  <div className="info-card">
                    <div className="info-dot"></div>
                    Avoid reflections and ensure proper lighting
                  </div>
                </div>
                <div className="col-12">
                  <div className="info-card">
                    <div className="info-dot"></div>
                    Your session will begin automatically after verification
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN - Camera */}
          <div className="col-md-7 d-flex align-items-center justify-content-center p-3 p-md-4 p-lg-5 bg-dark">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="camera-shell w-100"
              style={{ maxWidth: "620px" }}
            >
              {/* CAMERA HEADER */}
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

                {/* SCAN FRAME */}
                <div className="scan-frame">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>

                  {cameraReady && !loading && (
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="scan-line"
                    />
                  )}
                </div>

                {/* LOADING OVERLAY */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="camera-overlay"
                    >
                      <div className="text-center">
                        <div className="spinner-border text-danger" style={{ width: "4rem", height: "4rem" }} />
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
                      <button onClick={startCamera} className="btn btn-light rounded-pill px-5">
                        Retry Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="camera-actions">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
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

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}