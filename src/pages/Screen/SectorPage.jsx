import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Landmark, Factory, ChevronRight } from "lucide-react";
import { callRPC } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import KyndrylLogo from "../../assets/kyndryl.png";

const sectors = [
    {
        id: "bfsi",
        name: "BFSI",
        icon: Landmark,
        color: "#4A90E2"
    },
    {
        id: "mca",
        name: "MCA",
        icon: Factory,
        color: "#F5A623"
    },
];

export default function SectorPage() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const speak = (text) => {
        const synth = window.speechSynthesis;
        if (!synth) return;
        
        const performSpeech = (availableVoices) => {
            synth.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            
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

            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            synth.speak(utterance);
        };

        let voices = synth.getVoices();
        if (voices.length > 0) {
            performSpeech(voices);
        } else {
            synth.onvoiceschanged = () => {
                const updatedVoices = synth.getVoices();
                performSpeech(updatedVoices);
                synth.onvoiceschanged = null;
            };
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            speak("Select your sector");
        }, 500);
        return () => clearTimeout(timeout);
    }, []);

    const handleSectorSelect = async (sectorId) => {
        setLoading(true);
        try {
            // Using RPC (Postgres Function) instead of Edge Function for easier deployment
            const result = await callRPC('set_session_sector', {
                p_session_id: sessionId,
                p_sector: sectorId
            });

            if (result.questions) {
                navigate(`/game/${sessionId}`, {
                    state: { sectorId, questions: result.questions }
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
            <div className="container-fluid px-4 px-lg-5 pt-4 position-relative" style={{ zIndex: 10 }}>
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
                            Choose your sector for the challenge
                            experience.
                        </p>
                    </motion.div>
                </div>

                {/* SECTOR CARDS */}
                <div className="row g-4 justify-content-center w-100">
                    {sectors.map((sector, index) => (
                        <div
                            key={sector.id}
                            className="col-12 col-md-6 col-lg-5"
                        >
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
                                onClick={() =>
                                    !loading && handleSectorSelect(sector.id)
                                }
                                className={`sector-card ${loading ? "disabled-card" : ""
                                    }`}
                            >
                                {/* GLOW */}
                                <div
                                    className="sector-glow"
                                    style={{
                                        background: `${sector.color}`,
                                    }}
                                />

                                {/* ICON */}
                                <div
                                    className="sector-icon"
                                    style={{
                                        background: `${sector.color}15`,
                                        color: sector.color,
                                    }}
                                >
                                    <sector.icon size={48} strokeWidth={1.7} />
                                </div>

                                {/* CONTENT */}
                                <div className="sector-content">
                                    <h2>{sector.name}</h2>



                                    <div className="sector-action">
                                        {loading ? "PROCESSING..." : "ENTER EXPERIENCE"}

                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>

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
    )
}
