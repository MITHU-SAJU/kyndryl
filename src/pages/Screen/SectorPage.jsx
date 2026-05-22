import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Landmark, Factory, ChevronRight } from "lucide-react";
import { callRPC } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import KyndrylLogo from "../../assets/kyndryl.png";
import { speak, stopAllSpeech } from "../../lib/tts";

const sectors = [
  {
    id: "bfsi",
    name: "BFSI",
    color: "#4A90E2",
  },
  {
    id: "mca",
    name: "Manufacturing, Consumer goods & retailer, Aviation & Airports",
    color: "#F5A623",
  },
];

export default function SectorPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userName = location.state?.userName;
    if (userName) {
      speak(`Welcome ${userName}. Please select your sector `);
    } else {
      speak("Please select your sector ");
    }
    return () => {
      stopAllSpeech();
    };
  }, [location.state?.userName]);

  const handleSectorSelect = async (sectorId) => {
    setLoading(true);
    try {
      // Using RPC (Postgres Function) instead of Edge Function for easier deployment
      const result = await callRPC("set_session_sector", {
        p_session_id: sessionId,
        p_sector: sectorId,
      });

      if (result.questions) {
        navigate(`/game/${sessionId}`, {
          state: { sectorId, questions: result.questions },
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to set sector. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="sector-page min-vh-100 position-relative overflow-x-hidden"
      style={{
        minHeight: "100dvh",
        background:
          "linear-gradient(135deg, #f8f9fb 0%, #eef1f5 50%, #ffffff 100%)",
      }}
    >
      {/* BACKGROUND LINES */}
      <div className="bg-lines"></div>

      {/* TOP NAV */}
      <div
        className="container-fluid px-4 px-lg-5 pt-4 position-relative"
        style={{ zIndex: 10 }}
      >
        <div className="d-flex align-items-center justify-content-between">
          {/* LOGO LEFT */}
          <motion.img
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            src={KyndrylLogo}
            alt="Kyndryl"
            className="kyndryl-logo"
          />

          {/* SMALL LABEL */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="enterprise-badge"
          >
            60 SECOND CIO CHALLENGE
          </motion.div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        className="container d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "85dvh", position: "relative", zIndex: 5 }}
      >
        {/* HEADING */}
        <div className="text-center mb-5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="red-line mx-auto mb-4"></div>

            <h1 className="sector-title">
              Select Your <span>Sector</span>
            </h1>

            <p className="sector-subtitle">
              Choose your sector for the challenge experience.
            </p>
          </motion.div>
        </div>

        {/* SECTOR CARDS */}
        <div className="row g-4 justify-content-center w-100">
          {sectors.map((sector, index) => (
            <div key={sector.id} className="col-12 col-md-6 col-lg-5 d-flex">
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: index * 0.12,
                  duration: 0.5,
                }}
                whileHover={{
                  y: -10,
                  scale: 1.02,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !loading && handleSectorSelect(sector.id)}
                className={`sector-card ${loading ? "disabled-card" : ""}`}
              >
                {/* GLOW */}
                <div
                  className="sector-glow"
                  style={{
                    background: `${sector.color}`,
                  }}
                />

                {/* CONTENT */}
                <div className="sector-content">
                  <h2>{sector.name}</h2>

                  <div className="sector-action">
                    <span>
                      {loading ? "PROCESSING..." : "ENTER EXPERIENCE"}
                    </span>

                    <ChevronRight size={18} />
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        /* Sector cards: equal height, centered content */
        .sector-card {
          position: relative;
          width: 100%;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(16,24,40,0.06);
          background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.95));
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 220px;
          padding: 28px;
          transition: transform 220ms ease, box-shadow 220ms ease;
          cursor: pointer;
        }

        .sector-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(16,24,40,0.12);
        }

        .sector-glow {
          position: absolute;
          inset: 0;
          opacity: 0.06;
          filter: blur(28px);
          transform: scale(1.25);
        }

        .sector-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 18px;
          width: 100%;
        }

        .sector-content h2 {
          margin: 0;
          font-size: clamp(1.35rem, 2.6vw, 2.1rem);
          line-height: 1.05;
          color: #111827;
          font-weight: 400;
          word-break: break-word;
          max-width: 92%;
        }

        .sector-action {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #ff4d3d;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-size: 0.9rem;
        }

        /* Disabled state */
        .disabled-card { pointer-events: none; opacity: 0.6; }

        /* Make sure columns stretch to equal height */
        .row.g-4 > .d-flex { display: flex; }
        .row.g-4 > .d-flex > .sector-card { flex: 1 1 auto; }

        /* Small screens: slightly larger vertical spacing */
        @media (max-width: 576px) {
          .sector-card { min-height: 200px; padding: 20px; border-radius: 14px; }
          .sector-content h2 { font-size: 1.25rem; }
        }

        /* Wider screens: increase height for iPad landscape */
        @media (min-width: 1024px) and (orientation: landscape) {
          .sector-card { min-height: 280px; padding: 36px; }
          .sector-content h2 { font-size: clamp(1.6rem, 2.8vw, 2.6rem); }
        }
      `}</style>

      {/* LOADING OVERLAY */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="loading-overlay"
        >
          <div className="text-center">
            <div
              className="spinner-border text-danger"
              style={{
                width: "4rem",
                height: "4rem",
              }}
            />

            <div className="mt-4 fw-bold text-uppercase tracking-widest">
              Preparing Your Experience
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
