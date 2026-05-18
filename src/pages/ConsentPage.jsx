import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import KyndrylLogo from "../assets/kyndryl.png";

export default function ConsentPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const handleProceed = () => {
    navigate(`/scan/${eventId}`);
  };

  const [agreed, setAgreed] = useState(false);

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
        background: "#f4f4f4",
      }}
    >
      {/* BACKGROUND LINES */}
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

      {/* TOP NAVBAR */}
      <div
        className="container-fluid px-4 px-lg-5 py-4 position-relative"
        style={{ zIndex: 20 }}
      >
        <motion.img
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          src={KyndrylLogo}
          alt="Kyndryl"
          style={{
            width: "170px",
            height: "auto",
          }}
        />
      </div>

      {/* MAIN CONTENT */}
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
                  By continuing with this interaction, you consent
                  to Kyndryl collecting and processing the
                  information shared by you for the purposes of
                  event engagement, business communication,
                  follow-up conversations, marketing outreach,
                  and sharing relevant insights, solutions,
                  services, or event-related updates.<br></br>
                  Your information may be securely stored and
                  processed by Kyndryl and its authorized
                  partners in accordance with applicable data
                  privacy and protection laws.
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
    </div>
  );
}