import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, callFunction } from "../lib/supabase";
import Leaderboard from "../components/Leaderboard";
import _QRCode from "react-qr-code";

const QRCode = _QRCode.default || _QRCode;

export default function DisplayPage() {
  const { eventId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const result = await callFunction("get-leaderboard", {
        eventCode: eventId,
      });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch leaderboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("leaderboard-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  if (loading)
    return (
      <div className="min-vh-100 bg-black d-flex align-items-center justify-content-center text-white">
        <div className="text-center">
          <div
            className="spinner-border text-danger mb-4"
            style={{ width: "4rem", height: "4rem" }}
          ></div>
          <div className="h2 fw-bold text-uppercase tracking-widest">
            Initializing LED Wall...
          </div>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="min-vh-100 bg-black d-flex align-items-center justify-content-center text-danger">
        <div className="text-center">
          <h1 className="display-1 fw-bold">EVENT NOT FOUND</h1>
        </div>
      </div>
    );

  const { top10, stats, recentPlayer } = data;

  return (
    <div
      className="min-vh-100 d-flex flex-column position-relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
        color: "#fff",
      }}
    >
      {/* BACKGROUND GLOWS */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="position-absolute top-0 start-0 w-50 h-50 opacity-25"
          style={{
            background:
              "radial-gradient(circle at 0% 0%, #ff4d3d 0%, transparent 70%)",
          }}
        ></div>
        <div
          className="position-absolute bottom-0 end-0 w-50 h-50 opacity-25"
          style={{
            background:
              "radial-gradient(circle at 100% 100%, #ff4d3d 0%, transparent 70%)",
          }}
        ></div>
      </div>

      <div
        className="container-fluid h-100 px-4 px-lg-5 py-4 d-flex flex-column position-relative"
        style={{ zIndex: 10 }}
      >
        {/* HEADER */}
        <div className="row align-items-center mb-5">
          <div className="col-12 text-center">
            <h1 className="display-1 fw-900 mb-0 tracking-tighter">
              60-Second <span style={{ color: "#ff4d3d" }}>CHALLENGE</span>
            </h1>
            <p className="h3 text-white text-opacity-50 mt-3 fw-light tracking-widest text-uppercase">
              The Executive Leadership Experience
            </p>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="row g-5 flex-grow-1 align-items-center justify-content-center">
          {/* LEFT: RECENT */}
          <div className="col-xl-4">
            <div
              className="card border-0 rounded-5 p-5 h-100"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="h4 fw-bold text-uppercase tracking-widest text-secondary mb-5">
                Recently Participated
              </div>

              <div className="d-flex flex-column gap-4">
                {top10?.slice(0, 5).map((player, idx) => (
                  <motion.div
                    key={player.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-4 bg-white bg-opacity-5 border border-white border-opacity-10 d-flex align-items-center gap-4"
                  >
                    <div
                      className="rounded-circle bg-danger"
                      style={{ width: "12px", height: "12px" }}
                    ></div>
                    <div>
                      <div className="h4 fw-bold mb-0">{player.name}</div>
                      <div className="text-white text-opacity-50 small">
                        {player.company}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {(!top10 || top10.length === 0) && (
                  <div className="text-center py-5 opacity-50">
                    <div className="h2 mb-3">🤝</div>
                    <p>Waiting for the first leader...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: THE BIG QR */}
          <div className="col-xl-6 text-center">
            <div
              className="p-5 rounded-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <h2 className="display-4 fw-900 mb-5 tracking-tighter">
                SCAN TO START
              </h2>

              <div
                className="qr-wrapper d-inline-block bg-white p-5 rounded-5 shadow-2xl mb-5"
                style={{
                  boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
                  maxWidth: "min(60vmin, 400px)",
                  width: "100%",
                }}
              >
                <QRCode
                  value={window.location.origin + "/start/" + eventId}
                  level="H"
                />
              </div>

              <div className="d-flex align-items-center justify-content-center gap-4 mt-2">
                <div
                  style={{
                    width: "100px",
                    height: "2px",
                    background:
                      "linear-gradient(to left, #ff4d3d, transparent)",
                  }}
                ></div>
                <div className="h4 mb-0 fw-bold text-uppercase tracking-widest">
                  etcio2026
                </div>
                <div
                  style={{
                    width: "100px",
                    height: "2px",
                    background:
                      "linear-gradient(to right, #ff4d3d, transparent)",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER TICKER */}
        <div className="mt-5 py-3 text-center border-top border-white border-opacity-10">
          <div className="h5 fw-bold text-uppercase tracking-widest text-white text-opacity-30">
            Kyndryl & ETCIO Present • The 60-Second Challenge • Who will lead
            the pack?
          </div>
        </div>
      </div>

      <style>{`
        .fw-900 { font-weight: 900; }
        .tracking-tighter { letter-spacing: -3px; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        
        /* Custom styles for the Leaderboard component to ensure it scales for LED */
        .leaderboard-container table { font-size: 1.5rem !important; }
        .leaderboard-container .player-name { font-size: 1.8rem !important; font-weight: 800 !important; }
        .leaderboard-container .player-score { font-size: 2.2rem !important; color: #ff4d3d !important; font-weight: 900 !important; }
      `}</style>
    </div>
  );
}
