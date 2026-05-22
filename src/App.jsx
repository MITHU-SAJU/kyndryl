import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import StartPage from './pages/StartPage'
import LandingPage from './pages/LandingPage'
import ConsentPage from './pages/ConsentPage'
import GamePage from './pages/GamePage'
import ResultPage from './pages/ResultPage'

import SectorPage from './pages/Screen/SectorPage'
import GlobalNav from './components/GlobalNav'

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <GlobalNav />
      <Routes>
        {/* Root Redirect to Entry */}
        <Route path="/" element={<Navigate to="/start/etcio2026" replace />} />

        {/* Mandatory Consent Page (New Entry Point) */}
        <Route path="/start/:eventId" element={<ConsentPage />} />

        {/* Scanning Page (Moved from /start) */}
        <Route path="/scan/:eventId" element={<LandingPage />} />

        {/* Manual Registration Page */}
        <Route path="/register/:eventId" element={<StartPage />} />

        {/* Sector Selection Page */}
        <Route path="/sector/:sessionId" element={<SectorPage />} />

        {/* Game Page */}
        <Route path="/game/:sessionId" element={<GamePage />} />

        {/* Result Page */}
        <Route path="/result/:sessionId" element={<ResultPage />} />


        {/* Fallback to Display */}
        <Route path="*" element={<Navigate to="/display/etcio2026" replace />} />
      </Routes>
    </Router>
  )
}

export default App
