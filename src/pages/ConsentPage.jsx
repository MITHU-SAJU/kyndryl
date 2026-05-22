import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { speak, stopAllSpeech } from "../lib/tts";

export default function ConsentPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const handleProceed = () => {
    navigate(`/scan/${eventId}`);
  };

  const [agreed, setAgreed] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Speak welcome on mount and consent heading on exit
  useEffect(() => {
    if (showWelcome) {
      speak("Touch to continue.");
    } else {
      speak("Consent and Data Usage Acknowledgement");
    }
    return () => {
      stopAllSpeech();
    };
  }, [showWelcome]);

  // Handle click to transition from Welcome to Consent card
  const handleWelcomeClick = () => {
    setShowWelcome(false);
  };

  useEffect(() => {
    if (agreed) {
      const timer = setTimeout(() => {
        handleProceed();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [agreed]);

  return (
    <div
      className="min-vh-100 position-relative overflow-x-hidden"
      style={{
        minHeight: "100dvh",
        background: showWelcome ? "#000000" : "#f4f4f4",
        transition: "background 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* BACKGROUND DECORATIVE LINES (Only visible in Consent State) */}
      {!showWelcome && (
        <div
          className="position-absolute top-0 end-0 h-100 d-none d-lg-block opacity-10"
          style={{
            width: "420px",
            zIndex: 0,
          }}
        >
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                right: `${i * 28}px`,
                top: "-10%",
                width: "2px",
                height: "130%",
                background: "#ff4d3d",
                transform: "skewX(-22deg)",
              }}
            />
          ))}
        </div>
      )}

      {/* TOP NAVBAR (Only visible in Consent State) */}
      {!showWelcome && (
        <div
          className="container-fluid px-4 px-lg-5 py-4 position-relative"
          style={{ zIndex: 20 }}
        ></div>
      )}

      {/* FULLSCREEN ROBOT WELCOME SCREEN */}
      {/* FULLSCREEN ROBOT WELCOME SCREEN */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onClick={handleWelcomeClick}
            className="welcome-screen position-absolute top-0 start-0 w-100 h-100 overflow-hidden d-flex justify-content-center align-items-center"
            style={{
              zIndex: 1000,
              cursor: "pointer",
              background:
                "radial-gradient(circle at center, #120404 0%, #000 70%)",
            }}
          >
            {/* GLOW BACKGROUND */}
            <div
              style={{
                position: "absolute",
                width: "70vw",
                height: "70vw",
                borderRadius: "50%",
                background: "rgba(255,77,61,0.08)",
                filter: "blur(120px)",
                animation: "pulseGlow 4s ease-in-out infinite",
              }}
            />

            {/* INNER SCREEN AREA */}
            <div
              style={{
                width: "92%",
                height: "88%",
                border: "2px solid rgba(255,77,61,0.18)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                boxShadow: `
            inset 0 0 40px rgba(255,77,61,0.08),
            0 0 60px rgba(255,77,61,0.08)
          `,
              }}
            >
              {/* TOP CURVE */}

              {/* EYES */}
              <div
                className="d-flex justify-content-center align-items-center"
                style={{
                  gap: "clamp(80px, 18vw, 220px)",
                  marginTop: "8vh",
                }}
              >
                {/* LEFT EYE */}
                <div
                  style={{
                    width: "clamp(120px, 14vw, 220px)",
                    height: "clamp(160px, 18vw, 260px)",
                    border: "4px solid #ff4d3d",
                    borderRadius: "50%",
                    position: "relative",
                    boxShadow: `
                0 0 25px rgba(255,77,61,0.8),
                inset 0 0 30px rgba(255,77,61,0.25)
              `,
                    animation: "blinkEyes 4s infinite",
                  }}
                >
                  {/* PUPIL */}
                  <div
                    style={{
                      position: "absolute",
                      width: "35%",
                      height: "35%",
                      borderRadius: "50%",
                      background: "#ff4d3d",
                      top: "32%",
                      left: "32%",
                      boxShadow: `
                  0 0 25px #ff4d3d,
                  0 0 60px rgba(255,77,61,0.9)
                `,
                      animation: "pulseGlow 2s infinite",
                    }}
                  />
                </div>

                {/* RIGHT EYE */}
                <div
                  style={{
                    width: "clamp(120px, 14vw, 220px)",
                    height: "clamp(160px, 18vw, 260px)",
                    border: "4px solid #ff4d3d",
                    borderRadius: "50%",
                    position: "relative",
                    boxShadow: `
                0 0 25px rgba(255,77,61,0.8),
                inset 0 0 30px rgba(255,77,61,0.25)
              `,
                    animation: "blinkEyes 4s infinite",
                  }}
                >
                  {/* PUPIL */}
                  <div
                    style={{
                      position: "absolute",
                      width: "35%",
                      height: "35%",
                      borderRadius: "50%",
                      background: "#ff4d3d",
                      top: "32%",
                      left: "32%",
                      boxShadow: `
                  0 0 25px #ff4d3d,
                  0 0 60px rgba(255,77,61,0.9)
                `,
                      animation: "pulseGlow 2s infinite",
                    }}
                  />
                </div>
              </div>

              {/* SMILE */}
              <div
                style={{
                  marginTop: "8vh",
                  width: "clamp(180px, 24vw, 340px)",
                  height: "clamp(80px, 10vw, 140px)",
                  borderBottom: "6px solid #ff4d3d",
                  borderRadius: "0 0 300px 300px",
                  filter: "drop-shadow(0 0 18px #ff4d3d)",
                  animation: "smileGlow 2s ease-in-out infinite",
                }}
              />

              {/* TOUCH TEXT */}
              <div
                style={{
                  position: "absolute",
                  bottom: "5%",
                  color: "#ff4d3d",
                  letterSpacing: "4px",
                  fontSize: "12px",
                  fontWeight: 300,
                  opacity: 0.9,
                  textShadow: "0 0 12px #ff4d3d",
                  animation: "blinkText 1.5s infinite",
                  transition: "all 0.4s ease",
                }}
              >
                TOUCH TO CONTINUE
              </div>
            </div>

            {/* ANIMATIONS */}
            <style>
              {`
          @keyframes pulseGlow {
            0%,100% {
              transform: scale(1);
              opacity: 0.7;
            }
            50% {
              transform: scale(1.08);
              opacity: 1;
            }
          }

          @keyframes blinkGlow {
            0%,100% {
              opacity: 0.9;
            }
            50% {
              opacity: 0.3;
            }
          }

          @keyframes blinkEyes {
            0%, 92%, 100% {
              transform: scaleY(1);
            }
            95% {
              transform: scaleY(0.08);
            }
          }

          @keyframes smileGlow {
            0%,100% {
              opacity: 0.7;
              transform: translateY(0px);
            }
            50% {
              opacity: 1;
              transform: translateY(4px);
            }
          }

          @keyframes blinkText {
            0%,100% {
              opacity: 0.3;
            }
            50% {
              opacity: 1;
            }
          }
        `}
            </style>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONSENT CARD FLOW */}
      {!showWelcome && (
        <div
          className="container-fluid px-4 px-lg-5 position-relative"
          style={{ zIndex: 10 }}
        >
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              minHeight: "calc(100dvh - 120px)",
            }}
          >
            <div
              className="w-100"
              style={{
                maxWidth: "1400px",
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-5 overflow-hidden shadow-lg"
                style={{
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {/* TOP HEADER */}
                <div
                  className="px-4 px-lg-5 py-4 border-bottom"
                  style={{
                    background: "#fafafa",
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div>
                      <div
                        className="text-uppercase fw-bold mb-3"
                        style={{
                          letterSpacing: "3px",
                          fontSize: "1.5rem",
                          color: "#ff4d3d",
                        }}
                      >
                        Consent And Data Usage Acknowledgement
                      </div>

                      <div
                        style={{
                          width: "80px",
                          height: "3px",
                          background: "#ff4d3d",
                        }}
                      />
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "#ff4d3d",
                        }}
                      />
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "#ffc107",
                        }}
                      />
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "#28c76f",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* BODY */}
                <div className="p-3 p-md-4 p-lg-5">
                  {/* DESCRIPTION */}
                  <p
                    className="text-secondary mb-4"
                    style={{
                      fontSize: "clamp(0.9rem, 1.4vw, 1.1rem)",
                      lineHeight: 1.8,
                      maxWidth: "1100px",
                    }}
                  >
                    By continuing with this interaction, you consent to Kyndryl
                    collecting and processing the information shared by you for
                    the purposes of event engagement, business communication,
                    follow-up conversations, marketing outreach, and sharing
                    relevant insights, solutions, services, or event-related
                    updates.<br></br>
                    Your information may be securely stored and processed by
                    Kyndryl and its authorized partners in accordance with
                    applicable data privacy and protection laws.
                  </p>

                  {/* CONSENT POINTS */}
                  <div className="mb-4">
                    <ul
                      className="ps-3 mb-0"
                      style={{
                        lineHeight: 1.8,
                        color: "#333",
                        fontSize: "clamp(0.85rem, 1.3vw, 1.05rem)",
                      }}
                    >
                      {[
                        "The information shared by you is voluntary and accurate to the best of your knowledge",
                        "You agree to be contacted by Kyndryl regarding relevant offerings, events, insights, and follow-up discussions",
                        "You understand that you may opt out of communications at any time",
                      ].map((item, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.2 + index * 0.1,
                          }}
                          className="mb-2"
                          style={{
                            paddingLeft: "8px",
                          }}
                        >
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* FOOTER ACTION */}
                  <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                    {/* CONSENT CHECKBOX */}
                    <div
                      className="d-flex align-items-start gap-3 mb-0 p-3 rounded-4 w-100"
                      style={{
                        background: "#fafafa",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <div className="form-check m-0">
                        <input
                          type="checkbox"
                          id="consentCheck"
                          className="form-check-input"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          style={{
                            width: "22px",
                            height: "22px",
                            cursor: "pointer",
                            borderColor: "#ff4d3d",
                          }}
                        />
                      </div>

                      <label
                        htmlFor="consentCheck"
                        className="form-check-label text-dark"
                        style={{
                          cursor: "pointer",
                          lineHeight: 1.7,
                          fontSize: "clamp(0.8rem, 1.2vw, 1rem)",
                        }}
                      >
                        I acknowledge and agree to the collection and processing
                        of my information by Kyndryl for event participation,
                        communication, and related engagement activities.
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* FUTURISTIC ROBOT SCREEN STYLING */}
      <style>{`
        .welcome-screen {
          background: radial-gradient(circle at center, #111424 0%, #000000 100%);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: absolute;
          inset: 0;
          z-index: 1000;
          cursor: pointer;
          overflow: hidden;
          min-height: 100vh;
          min-height: 100dvh;
        }

        /* Tech Circles background */
        .tech-bg-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px dashed rgba(255, 77, 61, 0.12);
          animation: rotateClockwise 25s linear infinite;
        }
        .tech-bg-circle.size-1 { width: clamp(320px, 50vw, 500px); height: clamp(320px, 50vw, 500px); }
        .tech-bg-circle.size-2 { width: clamp(500px, 75vw, 800px); height: clamp(500px, 75vw, 800px); border-color: rgba(255, 77, 61, 0.05); animation-direction: reverse; animation-duration: 45s; }

        .logo-top {
          position: absolute;
          top: 5vh;
        }
        
        .welcome-logo {
          width: clamp(130px, 15vw, 180px);
          height: auto;
          filter: brightness(0) invert(1);
        }

        /* Blinking Animation */
        @keyframes blinkEyes {
          0%, 90%, 94%, 98%, 100% {
            transform: scaleY(1);
          }
          92%, 96% {
            transform: scaleY(0.08);
          }
        }

        /* Speaking/Pulsing Animation for Mouth */
        @keyframes speakMouth {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(1.15) scaleY(1.1); }
        }

        @keyframes rotateClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Pulsing touch text */
        .touch-prompt {
          font-size: clamp(0.7rem, 1.4vw, 0.95rem);
          font-weight: 800;
          letter-spacing: 4px;
          color: rgba(255, 255, 255, 0.7);
          animation: pulseText 2s infinite;
          text-transform: uppercase;
        }

        @keyframes pulseText {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 20px rgba(255, 77, 61, 0.1); }
          50% { opacity: 1; border-color: #ff4d3d; color: #ffffff; box-shadow: 0 0 35px rgba(255, 77, 61, 0.4); }
        }

        .pulsing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ff4d3d;
          box-shadow: 0 0 10px #ff4d3d;
          animation: pulseDot 1.5s infinite;
        }

        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
