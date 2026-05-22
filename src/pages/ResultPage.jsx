import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { callFunction } from "../lib/supabase";
import { toast } from "react-hot-toast";
import KyndrylLogo from "../assets/kyndryl.png";
import { ArrowRight } from "lucide-react";
import { speak, stopAllSpeech } from "../lib/tts";

export default function ResultPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const confettiCanvasRef = useRef(null);
  const paperStylesRef = useRef(null);

  // TTS removed — no unlock needed

  // FETCH RESULT ON LOAD
  useEffect(() => {
    async function fetchResult() {
      try {
        const result = await callFunction("get-result", {
          sessionId,
        });

        setData(result);

        // High quality ElevenLabs congratulatory TTS
        if (result?.user?.username) {
          speak(` Thank you, ${result.user.username}, for sharing your perspective.`);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load result");
      } finally {
        setLoading(false);
      }
    }

    fetchResult();

    return () => {
      stopAllSpeech();
    };
  }, [sessionId]);

  // Prepare falling paper styles once
  useEffect(() => {
    if (!paperStylesRef.current) {
      const colors = [
        "#ff4d3d",
        "#ffc107",
        "#28c76f",
        "#6f42c1",
        "#00bcd4",
        "#ff6f91",
      ];
      const styles = Array.from({ length: 28 }).map(() => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const duration = 5 + Math.random() * 6;
        const size = 10 + Math.random() * 18;
        const rotate = Math.random() * 360;
        const color = colors[Math.floor(Math.random() * colors.length)];
        return { left, delay, duration, size, rotate, color };
      });
      paperStylesRef.current = styles;
    }
  }, []);

  // Launch confetti and automatically navigate back to the Consent Page after 5 seconds
  useEffect(() => {
    if (!loading && data) {
      launchConfetti(confettiCanvasRef.current);

      const autoNavigateTimer = setTimeout(() => {
        navigate(`/start/${data.eventCode || "etcio2026"}`);
      }, 10000);

      return () => clearTimeout(autoNavigateTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data]);

  // Confetti implementation (simple canvas particle system)
  function launchConfetti(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpi = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpi;
    canvas.height = window.innerHeight * dpi;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.scale(dpi, dpi);

    const colors = [
      "#ff4d3d",
      "#ffc107",
      "#28c76f",
      "#6f42c1",
      "#00bcd4",
      "#ff6f91",
    ];
    const particles = [];
    const count = 120;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 6,
        size: 6 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 8,
      });
    }

    let rafId;
    const start = performance.now();

    function frame(now) {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let p of particles) {
        p.vy += 0.08; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    // stop after 5 seconds and clear
    setTimeout(() => {
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 5000);
  }

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
        minHeight: "100dvh",
      }}
    >
      {/* Confetti Canvas (drawn via JS) */}
      <canvas
        ref={confettiCanvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1050,
        }}
      />

      {/* Falling paper pieces */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1040,
        }}
      >
        {paperStylesRef.current &&
          paperStylesRef.current.map((s, idx) => (
            <div
              key={idx}
              className="paper-piece"
              style={{
                left: `${s.left}%`,
                width: `${s.size}px`,
                height: `${s.size * 0.6}px`,
                background: s.color,
                transform: `rotate(${s.rotate}deg)`,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
              }}
            />
          ))}
      </div>
      {/* Top Left Logo */}
      <div
        className="position-absolute top-0 start-0 p-4 p-lg-5"
        style={{ zIndex: 20 }}
      >
        <img
          src={KyndrylLogo}
          alt="Kyndryl Logo"
          className="img-fluid"
          style={{ width: "clamp(120px, 12vw, 220px)" }}
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
        className="position-relative z-2 text-center px-4 result-card"
        style={{ maxWidth: "clamp(420px, 60vw, 980px)" }}
      >
        {/* Congratulations Overlay */}
        <AnimatePresence>
          {!loading && data && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.6, ease: "backOut" }}
              className="position-absolute top-0 start-50 translate-middle-x text-center"
              style={{ zIndex: 1060, marginTop: "-4rem", width: "100%" }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "12px 26px",
                  borderRadius: 9999,
                  background: "linear-gradient(90deg,#ff4d3d,#ffc107)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                  color: "#fff",
                  fontWeight: 800,
                  letterSpacing: "1px",
                  fontSize: "clamp(1.4rem, 3vw, 2rem)",
                }}
              >
                CONGRATULATIONS!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Animated Check Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="mb-4 d-inline-block"
        ></motion.div>

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
          {user.username}
        </h2>

        <p
          className="mb-5 text-muted mx-auto"
          style={{
            fontSize: "1.15rem",
            lineHeight: "1.7",
            maxWidth: "480px",
          }}
        >
          for sharing your perspective and completing the 60-Second CIO
          Challenge. Your session has been successfully recorded.
        </p>


      </motion.div>


      {/* Styles for celebration effects */}
      <style>{`
        .paper-piece {
          position: absolute;
          top: -8vh;
          border-radius: 3px;
          opacity: 0.95;
          transform-origin: center;
          animation-name: paperFall, paperRotate;
          animation-timing-function: linear;
          animation-iteration-count: 1;
          will-change: transform, opacity;
        }

        @keyframes paperFall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0.95; }
          80% { opacity: 0.95; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0.9; }
        }

        @keyframes paperRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* iPad Pro / large tablet landscape tweaks */
        @media (min-width: 1024px) and (orientation: landscape) {
          .result-card {
            padding-left: 3rem !important;
            padding-right: 3rem !important;
          }

          .result-card h1 {
            font-size: clamp(2.8rem, 4.5vw, 5rem) !important;
          }

          .result-card h2 {
            font-size: clamp(2rem, 3.6vw, 3.8rem) !important;
          }

          .result-card p {
            font-size: 1.18rem !important;
            max-width: 700px;
          }

          .result-card .btn {
            min-width: 360px !important;
            font-size: 1.12rem !important;
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
