import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, callFunction } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import KyndrylLogo from '../assets/kyndryl.png'
import QRCodeModule from 'react-qr-code'
const QRCode = QRCodeModule.default || QRCodeModule
import Leaderboard from '../components/Leaderboard'

export default function StartPage() {
  const [top10, setTop10] = useState([])
  const { eventId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [eventData, setEventData] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    designation: '',
    email: ''
  })

  useEffect(() => {
    if (location.state?.prefill) {
      const { name, company, designation, email } = location.state.prefill
      setFormData(prev => ({
        ...prev,
        name: name || prev.name,
        company: company || prev.company,
        designation: designation || prev.designation,
        email: email || prev.email
      }))
    }
  }, [location.state])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        // Fetch Event Data
        const { data: eData, error: eError } = await supabase
          .from('events')
          .select('*')
          .eq('event_code', eventId)
          .eq('is_active', true)
          .single()

        if (eError || !eData) {
          console.error('Event error:', eError)
          setEventData(null)
        } else {
          setEventData(eData)
        }
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
        setDataLoaded(true)
      }
    }

    if (eventId) fetchData()
  }, [eventId])

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.company) {
      toast.error('Name and Company are required')
      return
    }

    setLoading(true)

    try {
      const result = await callFunction('create-session', {
        eventCode: eventId,
        ...formData
      })

      if (result.sessionId) {
        speak(`Welcome ${formData.name}`);
        navigate(`/sector/${result.sessionId}`, {
          state: { questions: result.questions }
        })
      }
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Failed to start challenge')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !dataLoaded) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (dataLoaded && !eventData) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 p-4">
        <div className="text-center">
          <h1 className="display-4 fw-bold text-danger">Event Not Found</h1>
          <p className="mt-2 text-muted">The event code you provided is invalid or the event has ended.</p>
          <button onClick={() => navigate('/')} className="btn btn-outline-dark mt-4 rounded-pill px-4">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid min-vh-100 p-0 overflow-x-hidden" style={{ minHeight: "100dvh" }}>
      <div className="row g-0 min-vh-100" style={{ minHeight: "100dvh" }}>

        {/* LEFT SIDE */}
        <div
          className="col-md-5 d-flex flex-column justify-content-center position-relative px-4 px-md-5 py-5 py-md-0"
          style={{
            background: "#f5f5f5",
            overflow: "hidden",
            minHeight: "40dvh",
          }}
        >

          {/* TOP LEFT LOGO */}
          <div
            className="position-absolute top-0 start-0 p-4 p-lg-5"
            style={{ zIndex: 20 }}
          >
            <img
              src={KyndrylLogo}
              alt="Kyndryl Logo"
              className="img-fluid"
              style={{
                width: "160px",
                maxWidth: "100%",
              }}
            />
          </div>

          {/* Main Title */}
          <div className="position-relative z-2 text-center text-lg-start">
            <h1
              className="fw-light lh-1 mb-3"
              style={{
                fontSize: "clamp(2.5rem, 7vw, 6rem)",
                color: "#ff4d3d",
                letterSpacing: "-2px",
              }}
            >
              60-Second
              <br />
              CIO Challenge
            </h1>
          </div>


          {/* Decorative Pattern */}
          <div
            className="position-absolute top-0 end-0 h-100 d-none d-lg-block"
            style={{
              width: "220px",
              opacity: 0.5,
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
        </div>

        {/* RIGHT SIDE FORM */}
        <div
          className="col-md-7 d-flex align-items-center justify-content-center"
          style={{
            background: "#ffffff",
          }}
        >
          <div
            className="w-100 d-flex flex-column justify-content-center px-4 px-md-5 py-5"
            style={{
              maxWidth: "720px",
              minHeight: "60dvh",
            }}
          >

            {/* Back Button */}
            <div className="mb-4">
              <button
                onClick={() => navigate(`/start/${eventId}`)}
                className="btn btn-link text-muted p-0 text-decoration-none small fw-bold"
              >
                ← BACK TO SCANNER
              </button>
            </div>

            {/* Main Heading */}
            <div className="mb-4">
              <h1
                className="mb-2 lh-1"
                style={{
                  fontSize: "clamp(2.8rem, 5vw, 5rem)",
                  fontWeight: "700",
                  color: "#2b2b2b",
                  letterSpacing: "-3px",
                }}
              >
                Welcome
              </h1>

              <h2
                className="lh-1"
                style={{
                  fontSize: "clamp(2rem, 4vw, 4rem)",
                  fontWeight: "300",
                  color: "#ff4d3d",
                  letterSpacing: "-2px",
                }}
              >
                Start Your Challenge
              </h2>
            </div>

            {/* Description */}
            <p
              className="mb-5"
              style={{
                color: "#7a7a7a",
                fontSize: "1.05rem",
                lineHeight: "1.8",
                maxWidth: "550px",
              }}
            >
              Enter your professional details below to participate in the
              60-Second CIO Challenge experience.
            </p>

            {/* FORM */}
            <form onSubmit={handleSubmit}>

              <div className="row g-4">

                {/* Full Name */}
                <div className="col-12">
                  <label
                    className="form-label mb-2"
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      letterSpacing: "1px",
                      color: "#444",
                      textTransform: "uppercase",
                    }}
                  >
                    Full Name
                  </label>

                  <input
                    required
                    type="text"
                    placeholder="Enter your full name"
                    className="form-control border-0 border-bottom rounded-0 shadow-none px-0"
                    style={{
                      height: "58px",
                      fontSize: "1.15rem",
                      background: "transparent",
                      borderBottom: "2px solid #dcdcdc",
                    }}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Company */}
                <div className="col-12 col-md-6">
                  <label
                    className="form-label mb-2"
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      letterSpacing: "1px",
                      color: "#444",
                      textTransform: "uppercase",
                    }}
                  >
                    Company
                  </label>

                  <input
                    required
                    type="text"
                    placeholder="Company name"
                    className="form-control border-0 border-bottom rounded-0 shadow-none px-0"
                    style={{
                      height: "58px",
                      fontSize: "1.1rem",
                      background: "transparent",
                      borderBottom: "2px solid #dcdcdc",
                    }}
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Designation */}
                <div className="col-12 col-md-6">
                  <label
                    className="form-label mb-2"
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      letterSpacing: "1px",
                      color: "#444",
                      textTransform: "uppercase",
                    }}
                  >
                    Designation
                  </label>

                  <input
                    required
                    type="text"
                    placeholder="Your designation"
                    className="form-control border-0 border-bottom rounded-0 shadow-none px-0"
                    style={{
                      height: "58px",
                      fontSize: "1.1rem",
                      background: "transparent",
                      borderBottom: "2px solid #dcdcdc",
                    }}
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        designation: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Email */}
                <div className="col-12">
                  <label
                    className="form-label mb-2"
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      letterSpacing: "1px",
                      color: "#444",
                      textTransform: "uppercase",
                    }}
                  >
                    Email Address
                  </label>

                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="form-control border-0 border-bottom rounded-0 shadow-none px-0"
                    style={{
                      height: "58px",
                      fontSize: "1.1rem",
                      background: "transparent",
                      borderBottom: "2px solid #dcdcdc",
                    }}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Button */}
                <div className="col-12 pt-4">
                  <button
                    disabled={loading}
                    type="submit"
                    className="btn rounded-pill px-5 py-3 fw-bold"
                    style={{
                      background: "#ff4d3d",
                      color: "#fff",
                      border: "none",
                      minWidth: "220px",
                      fontSize: "1rem",
                      letterSpacing: "1px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {loading
                      ? "PREPARING..."
                      : "START CHALLENGE"}
                  </button>
                </div>

              </div>
            </form>

            {/* Footer */}
            {/* <div className="mt-5 pt-3">
              <p
                className="mb-0"
                style={{
                  fontSize: "0.9rem",
                  color: "#8a8a8a",
                  lineHeight: "1.8",
                }}
              >
                Powered by <strong>ETCIO</strong> &{" "}
                <strong>Enterprise Leaders Network</strong>
              </p>
            </div> */}

          </div>
        </div>

      </div>
    </div>
  )
}
