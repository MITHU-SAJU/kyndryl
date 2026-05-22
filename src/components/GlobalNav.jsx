import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Home, ArrowRight } from 'lucide-react'

export default function GlobalNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showNav, setShowNav] = useState(false)

  // Track the eventId from URL parameters dynamically to remember the event context
  useEffect(() => {
    const pathParts = location.pathname.split('/')
    // Routes like /start/:eventId, /scan/:eventId, /register/:eventId, /display/:eventId
    const routeType = pathParts[1]
    const routeId = pathParts[2]

    if (routeId && ['start', 'scan', 'register', 'display'].includes(routeType)) {
      localStorage.setItem('lastEventId', routeId)
    }
  }, [location.pathname])

  // Poll for the welcome screen to ensure we hide the nav bar when the big robot face is visible
  useEffect(() => {
    const checkVisibility = () => {
      // 1. Never show navigation on the LED Display screen
      if (location.pathname.startsWith('/display')) {
        setShowNav(false)
        return
      }

      // 2. Check if the Consent page welcome screen is active in the DOM
      const hasWelcomeScreen = document.querySelector('.welcome-screen')
      setShowNav(!hasWelcomeScreen)
    }

    checkVisibility()
    const interval = setInterval(checkVisibility, 150)
    return () => clearInterval(interval)
  }, [location.pathname])

  // 3-Minute Session Idle Inactivity Timeout Setup
  useEffect(() => {
    // 1. Skip idle tracking on the LED Display scoreboard
    if (location.pathname.startsWith('/display')) {
      return
    }

    const hasWelcomeScreen = document.querySelector('.welcome-screen')
    // 2. If the user is on the welcome page (big robot face is pulsing), we don't start the timer
    if (hasWelcomeScreen && location.pathname.startsWith('/start')) {
      return
    }

    const timeoutMs = 3 * 60 * 1000 // 3 minutes
    let idleTimer

    const handleTimeout = () => {
      const eventId = localStorage.getItem('lastEventId') || 'etcio2026'
      console.log('Session idle for 3 minutes. Wiping state and resetting kiosk to welcome screen.')
      
      // Perform a full window reload/redirect to cleanly terminate camera streams, speech synthesis, and state
      window.location.href = `/start/${eventId}`
    }

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(handleTimeout, timeoutMs)
    }

    // Initialize timer on page mount or path change
    resetIdleTimer()

    // Activity event listeners to keep the session alive
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetIdleTimer, { passive: true })
    })

    return () => {
      if (idleTimer) clearTimeout(idleTimer)
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer)
      })
    }
  }, [location.pathname])

  if (!showNav) return null

  const handleHome = () => {
    const eventId = localStorage.getItem('lastEventId') || 'etcio2026'
    navigate(`/start/${eventId}`)
  }

  const isResultPage = location.pathname.startsWith('/result')

  return (
    <div className="global-nav-container">
      {!isResultPage && (
        <button 
          onClick={() => navigate(-1)} 
          className="nav-btn" 
          title="Back"
          aria-label="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      
      <button 
        onClick={handleHome} 
        className="nav-btn home-btn" 
        title="Consent Home"
        aria-label="Go to Consent Page"
      >
        <Home size={20} />
      </button>

      {!isResultPage && (
        <button 
          onClick={() => navigate(1)} 
          className="nav-btn" 
          title="Forward"
          aria-label="Go Forward"
        >
          <ArrowRight size={20} />
        </button>
      )}

      <style>{`
        .global-nav-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 999px;
          border: 1px solid rgba(255, 77, 61, 0.25);
          box-shadow: 
            0 8px 32px rgba(255, 77, 61, 0.12),
            0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideInNav 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideInNav {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .nav-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: #ff4d3d;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        /* Apple HIG touch guidelines standard touch boundaries */
        .nav-btn::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
        }

        .nav-btn:hover {
          background: rgba(255, 77, 61, 0.1);
          transform: scale(1.08);
          color: #ff1f1f;
        }

        .nav-btn:active {
          transform: scale(0.92);
          background: rgba(255, 77, 61, 0.2);
        }

        .home-btn {
          background: rgba(255, 77, 61, 0.08);
          border: 1px solid rgba(255, 77, 61, 0.15);
        }

        .home-btn:hover {
          background: #ff4d3d;
          color: #ffffff;
          border-color: #ff4d3d;
          box-shadow: 0 0 15px rgba(255, 77, 61, 0.4);
        }

        /* Adjust positions for safe-areas inside iOS standalone PWA */
        @media (display-mode: standalone) {
          .global-nav-container {
            top: calc(16px + env(safe-area-inset-top, 20px));
            right: calc(16px + env(safe-area-inset-right, 0px));
          }
        }

        /* Mobile layout adjustments */
        @media (max-width: 576px) {
          .global-nav-container {
            top: 12px;
            right: 12px;
            padding: 6px 10px;
          }
          .nav-btn {
            width: 38px;
            height: 38px;
          }
        }
      `}</style>
    </div>
  )
}
