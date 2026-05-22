// ElevenLabs and Web Speech API Unified TTS Service

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel female voice

// In-memory cache for generated voiceovers to save character quota
const audioCache = {};

// Keep track of active fetch promises for de-duplication
const activeFetches = {};

// Persistent session flag to bypass ElevenLabs on repeated auth failures
let elevenLabsDisabled = false;
try {
  if (sessionStorage.getItem("elevenlabs_disabled") === "true") {
    elevenLabsDisabled = true;
  }
} catch (e) {
  // Ignore sessionStorage missing in certain contexts
}

// Track last spoken text and timestamp to throttle double triggers in dev (StrictMode)
let lastSpokenText = "";
let lastSpokenTime = 0;

// Track last time a new speak request was initiated to protect page transitions from unmount cleanups
let lastSpeakCalledTime = 0;

// Keep track of the currently playing audio or speech synthesis utterance
let currentAudio = null;

/**
 * Resilient local SpeechSynthesis fallback (native browser speech synthesis)
 */
function speakBrowserFallback(text) {
  const synth = window.speechSynthesis;
  if (!synth) {
    console.warn("[TTS] Web Speech API not supported in this browser.");
    return;
  }

  // Cancel any ongoing native browser speech
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Attempt to select a high-quality humanistic female voice
  const performFallbackSpeech = (availableVoices) => {
    const preferredVoice =
      availableVoices.find((v) => {
        const name = v.name.toLowerCase();
        return (
          v.lang.startsWith("en") &&
          (name.includes("female") ||
            name.includes("samantha") ||
            name.includes("zira") ||
            name.includes("victoria") ||
            name.includes("tessa") ||
            name.includes("moira") ||
            (name.includes("google") &&
              name.includes("english") &&
              !name.includes("male")))
        );
      }) ||
      availableVoices.find((v) => v.name.toLowerCase().includes("female")) ||
      availableVoices.find(
        (v) => v.lang.startsWith("en-US") && !v.name.toLowerCase().includes("male")
      ) ||
      availableVoices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    synth.speak(utterance);
  };

  const voices = synth.getVoices();
  if (voices.length > 0) {
    performFallbackSpeech(voices);
  } else {
    // Wait for voices to load if not initialized yet
    synth.onvoiceschanged = () => {
      const updatedVoices = synth.getVoices();
      performFallbackSpeech(updatedVoices);
      synth.onvoiceschanged = null;
    };
  }
}

/**
 * Cleanly stops any currently playing TTS audio or browser speech
 */
export function stopAllSpeech(force = false) {
  if (!force && Date.now() - lastSpeakCalledTime < 250) {
    console.log("[TTS] stopAllSpeech ignored to protect new page speech during transition.");
    return;
  }

  // Stop custom HTML5 audio playback
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {
      console.error("[TTS] Error stopping audio playback:", e);
    }
    currentAudio = null;
  }

  // Stop native speech synthesis
  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.error("[TTS] Error canceling speech synthesis:", e);
    }
  }
}

/**
 * Main speak function with cache optimization and fallback support
 * @param {string} text - The words to speak
 */
export async function speak(text) {
  if (!text) return;

  const trimmedText = text.trim();
  const now = Date.now();

  // Throttle duplicate speak requests triggered in quick succession (e.g. React StrictMode double mount)
  if (trimmedText === lastSpokenText && now - lastSpokenTime < 150) {
    console.log(`[TTS] Throttling duplicate speech call within 150ms: "${trimmedText.substring(0, 30)}..."`);
    return;
  }
  lastSpokenText = trimmedText;
  lastSpokenTime = now;

  // We are about to start a new speech, update the timestamp before calling stopAllSpeech
  lastSpeakCalledTime = now;

  // Force stop any currently playing audio so speeches do not overlap
  stopAllSpeech(true);

  // Check if we already have this audio cached in memory
  if (audioCache[trimmedText]) {
    console.log(`[TTS] Playing cached voiceover for text: "${trimmedText.substring(0, 30)}..."`);
    playAudioUrl(audioCache[trimmedText]);
    return;
  }

  // If ElevenLabs is persistently disabled or missing API key, skip network attempt entirely
  if (elevenLabsDisabled || !ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.includes("your_api_key")) {
    speakBrowserFallback(trimmedText);
    return;
  }

  // If there's an ongoing identical fetch, reuse it to prevent parallel redundant requests
  if (activeFetches[trimmedText]) {
    console.log(`[TTS] Attaching to active ElevenLabs fetch for: "${trimmedText.substring(0, 30)}..."`);
    try {
      const audioUrl = await activeFetches[trimmedText];
      playAudioUrl(audioUrl);
    } catch (error) {
      // The shared fetch failed, fallback is already triggered or we trigger it here
      speakBrowserFallback(trimmedText);
    }
    return;
  }

  // Create the fetch promise and register it
  const fetchPromise = (async () => {
    try {
      console.log(`[TTS] Fetching from ElevenLabs: "${trimmedText.substring(0, 30)}..."`);
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: trimmedText,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        // Flag ElevenLabs as disabled if we get an authorization/permission failure (401/403)
        if (response.status === 401 || response.status === 403) {
          elevenLabsDisabled = true;
          try {
            sessionStorage.setItem("elevenlabs_disabled", "true");
          } catch (e) {}
          console.warn(`[TTS] ElevenLabs API returned HTTP ${response.status} (Auth Error). Disabling ElevenLabs TTS and using local SpeechSynthesis.`);
        }
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      // Save generated blob url in cache to prevent repeated API calls
      audioCache[trimmedText] = audioUrl;
      return audioUrl;
    } finally {
      // Remove from active registry upon completion/failure
      delete activeFetches[trimmedText];
    }
  })();

  activeFetches[trimmedText] = fetchPromise;

  try {
    const audioUrl = await fetchPromise;
    playAudioUrl(audioUrl);
  } catch (error) {
    console.error("[TTS] ElevenLabs API request failed. Falling back to browser SpeechSynthesis.", error);
    speakBrowserFallback(trimmedText);
  }
}

/**
 * Helper to play HTML5 audio url
 */
function playAudioUrl(url) {
  const audio = new Audio(url);
  currentAudio = audio;
  audio.play().catch((err) => {
    console.warn("[TTS] Autoplay blocked or audio playback failed:", err);
  });
}
