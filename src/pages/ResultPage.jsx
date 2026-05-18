import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { callFunction } from "../lib/supabase";
import { toast } from "react-hot-toast";

export default function ResultPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const hasSpoken = useRef(false);

  // 1. Timer Logic
  useEffect(() => {
    if (data && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [data, countdown]);

  // 2. Navigation Logic (Safe side-effect)
  useEffect(() => {
    if (countdown === 0 && data) {
      const eventId = data.eventCode || "etcio2026";
      navigate(`/start/${eventId}`);
    }
  }, [countdown, data, navigate]);

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
      // Wait for voices to load
      synth.onvoiceschanged = () => {
        const updatedVoices = synth.getVoices();
        performSpeech(updatedVoices);
        synth.onvoiceschanged = null; // Clean up
      };
    }
  };

  // Fetch Results
  useEffect(() => {
    async function fetchResult() {
      try {
        const result = await callFunction("get-result", { sessionId });
        setData(result);
        if (result?.user?.name && !hasSpoken.current) {
          hasSpoken.current = true;
          speak(`Thank you, ${result.user.name}, For sharing your perspective..`);
        }
      } catch (error) {
        toast.error("Failed to load result");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
        <div className="text-center">
          <div className="spinner-border text-danger mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>

        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-danger">
        <div className="text-center">
          <div className="h4 fw-bold">Result not found.</div>
          <button onClick={() => navigate('/')} className="btn btn-outline-danger mt-3 rounded-pill">Return to Home</button>
        </div>
      </div>
    );
  }

  const { user, result } = data;

  return (
    <div className="result-page min-vh-100 position-relative overflow-x-hidden d-flex align-items-center py-4 py-lg-5" style={{ minHeight: "100dvh" }}>

      {/* CONFETTI */}
      <div className="confetti-container">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `-${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 5}s`,
              width: `${6 + Math.random() * 10}px`,
              height: `${10 + Math.random() * 18}px`,
            }}
          />
        ))}
      </div>

      {/* BACKGROUND LINES */}
      <div className="kyndryl-lines d-none d-xl-block">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="line"
            style={{
              right: `${i * 24}px`,
            }}
          />
        ))}
      </div>

      <div className="container py-3 position-relative z-2" style={{ maxWidth: '1400px' }}>

        <div className="row g-4 align-items-stretch justify-content-center">

          {/* LEFT: Thank You Message */}
          <div className="col-12 col-md-10 col-lg-8 col-xl-7">

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="result-left-card h-100 d-flex flex-column justify-content-between text-center"
            >
              <div>
                <div className="result-tag">Challenge Completed</div>
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="hurray-text"
                >
                  THANK YOU!
                </motion.h1>
                <h2 className="result-title mt-3">For sharing your perspective.</h2>
              </div>

              <div className="user-block my-5">
                <div className="h2 fw-bold mb-2" style={{ color: '#ff4d3d' }}>{user.name}</div>

              </div>



              <div className="mt-5">
                <div
                  className="py-3 px-5 rounded-pill d-inline-flex align-items-center gap-3 shadow-sm"
                  style={{ background: '#fff', border: '1px solid rgba(255,77,61,0.2)' }}
                >
                  <div className="spinner-border spinner-border-sm text-danger" role="status"></div>
                  <span className="h6 mb-0 fw-bold text-uppercase tracking-wider text-danger">
                    Returning to Home in {countdown}s
                  </span>
                </div>
              </div>

            </motion.div>

          </div>

        </div>

      </div>

      <style>{`
      .result-page { background: #f8f9fa; }
      .kyndryl-lines { position: absolute; inset: 0; opacity: 0.08; z-index: 0; }
      .line { position: absolute; top: -10%; width: 2px; height: 130%; background: #ff4d3d; transform: skewX(-22deg); }
      .confetti-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1; }
      .confetti { position: absolute; top: -60px; background: linear-gradient(135deg, #ff4d3d, #ff8a5e); border-radius: 3px; animation: fall linear infinite; opacity: 0.9; }
      @keyframes fall { to { transform: translateY(110vh) rotate(720deg); } }
      
      .result-left-card, .result-right-card {
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
        border-radius: 40px;
        padding: clamp(20px, 4vw, 50px);
        box-shadow: 0 25px 70px rgba(0,0,0,0.07);
        border: 1px solid rgba(0,0,0,0.03);
      }

      .result-tag, .leaderboard-tag { font-size: clamp(0.7rem, 1.2vw, 0.8rem); font-weight: 800; letter-spacing: 3px; color: #ff4d3d; margin-bottom: clamp(10px, 1.5vw, 15px); text-transform: uppercase; }
      .hurray-text { font-size: clamp(2.5rem, 6vw, 6rem); font-weight: 900; letter-spacing: -3px; line-height: 0.95; color: #222; }
      .result-title { font-size: clamp(1.2rem, 3vw, 2rem); color: #666; font-weight: 300; letter-spacing: -1px; }

      .score-circle {
        width: clamp(180px, 20vw, 240px);
        height: clamp(180px, 20vw, 240px);
        border-radius: 50%;
        background: linear-gradient(135deg, #ff4d3d 0%, #ff1a1a 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 20px 50px rgba(255,77,61,0.3);
      }
      .score-value { font-size: clamp(4rem, 8vw, 6rem); font-weight: 900; line-height: 1; letter-spacing: -5px; }
      .score-label { font-size: clamp(0.65rem, 1vw, 0.8rem); font-weight: 700; letter-spacing: 4px; }

      .dark-card { background: #222; color: white; border: none; padding: clamp(20px, 3vw, 35px); border-radius: 30px; }
      .stat-card { padding: clamp(20px, 3vw, 35px); border-radius: 30px; border: 2px solid #eee; }
      .stat-label { font-size: clamp(0.65rem, 1vw, 0.75rem); font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
      .stat-value { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 900; line-height: 1; letter-spacing: -2px; }
      .stat-sub { font-size: clamp(0.75rem, 1.2vw, 0.9rem); opacity: 0.6; margin-top: 5px; }

      .trophy-box { font-size: clamp(2.5rem, 4vw, 3.5rem); background: #fff5f4; width: clamp(70px, 8vw, 100px); height: clamp(70px, 8vw, 100px); display: flex; align-items: center; justify-content: center; border-radius: 25px; border: 1px solid #ffebea; }

      @media (max-width: 991px) {
        .result-left-card, .result-right-card { border-radius: 30px; }
      }
      `}</style>
    </div>
  );
}
