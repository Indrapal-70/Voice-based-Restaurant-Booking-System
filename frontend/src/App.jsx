import React, { useEffect, useRef, useState } from 'react';

function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

export default function App() {
  const [supportsRecording, setSupportsRecording] = useState(false);
  const [supportsTTS, setSupportsTTS] = useState(
    typeof window !== 'undefined' && !!window.speechSynthesis
  );
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [voiceLog, setVoiceLog] = useState([
    {
      from: 'agent',
      text:
        'Hi! I can help you book a table at our restaurant. Please tap the microphone and tell me your name.'
    }
  ]);

  const [step, setStep] = useState('name');
  const [customerName, setCustomerName] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [cuisinePreference, setCuisinePreference] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [location, setLocation] = useState('');
  const [seatingPreference, setSeatingPreference] = useState('unspecified');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [weatherSuggestion, setWeatherSuggestion] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const consoleRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setSupportsRecording(true);
    } else {
      setSupportsRecording(false);
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSupportsTTS(false);
    }
  }, []);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [voiceLog]);

  function askNext(question) {
    setVoiceLog((prev) => [...prev, { from: 'agent', text: question }]);
    if (supportsTTS) {
      speak(question);
    }
  }

  function handleTranscript(text) {
    setError('');
    const lower = text.toLowerCase();

    if (step === 'name') {
      // Try to extract just the name without common filler words
      let extractedName = text;


      const namePrefixes = [
        /^(okay|ok|yes|sure|alright|well|um|uh)[,\s]*/i,
        /^(my\s+name\s+is|i\s+am|this\s+is|it's|its)\s+/i,
        /^(call\s+me)\s+/i
      ];

      for (const prefix of namePrefixes) {
        extractedName = extractedName.replace(prefix, '').trim();
      }


      extractedName = extractedName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      setCustomerName(extractedName);
      setStep('city');
      askNext(
        `Nice to meet you, ${extractedName}. Which city would you like to make your booking in?`
      );
      return;
    }

    if (step === 'city') {

      let cityName = text.replace(/^(in|at)\s+/i, '').trim();
      cityName = cityName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      setLocation(cityName);
      setStep('guests');
      askNext(
        `Great! ${cityName} it is. How many guests will be joining you?`
      );
      return;
    }

    if (step === 'guests') {
      const numMatch = lower.match(/(\d+)/);
      if (numMatch) {
        setNumberOfGuests(numMatch[1]);
        setStep('datetime');
        askNext(
          'Great. On which date and at what time would you like to book? For example, say: 5th December at 7 pm.'
        );
      } else {
        askNext(
          "I couldn't catch the number of guests. Please say something like: table for 2."
        );
      }
      return;
    }

    if (step === 'datetime') {

      const timeMatch =
        lower.match(/(\d{1,2}\s?(am|pm))/) ||
        lower.match(/(\d{1,2}:\d{2}\s?(am|pm)?)/) ||
        lower.match(/(\d{1,2})\s*(o'?clock)?/);

      if (timeMatch) {
        let time = timeMatch[1];
        // Most people mean PM for dinner reservations
        if (!time.toLowerCase().includes('am') && !time.toLowerCase().includes('pm')) {
          const hour = parseInt(time);
          if (hour >= 1 && hour <= 11) {
            time = time + ' pm';
          } else if (hour === 12) {
            time = time + ' pm';
          }
        }
        setBookingTime(time);
      }


      let extractedDate = '';

      // Check for specific date patterns
      const today = new Date();

      // Helper to format date without timezone issues
      const formatDate = (year, month, day) => {
        const yyyy = year;
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };


      if (lower.includes('today')) {
        extractedDate = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
      } else if (lower.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        extractedDate = formatDate(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      } else {
        // Try parsing natural date formats like "5th December" or "December 5"
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december'];

        let month = -1;
        let day = -1;


        for (let i = 0; i < monthNames.length; i++) {
          if (lower.includes(monthNames[i])) {
            month = i;
            break;
          }
        }


        const dayMatch = text.match(/(\d{1,2})(st|nd|rd|th)?/);
        if (dayMatch) {
          day = parseInt(dayMatch[1]);
        }


        if (month >= 0 && day > 0) {
          let year = today.getFullYear();
          const date = new Date(year, month, day);

          // If someone says a past date, they probably mean next year
          if (date < today) {
            year = year + 1;
          }

          extractedDate = formatDate(year, month, day);
        }
      }

      if (extractedDate) {
        setBookingDate(extractedDate);
      }

      setStep('cuisine');
      askNext(
        'Got it. What kind of cuisine do you prefer? We offer Italian, Indian, or Chinese.'
      );
      return;
    }

    if (step === 'cuisine') {
      // We only offer these three cuisines
      const allowedCuisines = ['italian', 'indian', 'chinese'];
      const normalizedInput = lower.trim();

      let matchedCuisine = null;
      for (const cuisine of allowedCuisines) {
        if (normalizedInput.includes(cuisine)) {
          matchedCuisine = cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
          break;
        }
      }

      if (matchedCuisine) {
        setCuisinePreference(matchedCuisine);
        setStep('special');
        askNext(
          'Any special requests? For example a birthday, anniversary, or dietary preferences. You can also say no special requests.'
        );
      } else {
        askNext(
          'Sorry, we only offer Italian, Indian, or Chinese cuisine. Which one would you prefer?'
        );
      }
      return;
    }

    if (step === 'special') {
      if (lower.includes('no') && lower.includes('special')) {
        setSpecialRequests('');
      } else {
        setSpecialRequests(text);
      }
      setStep('confirm');
      askNext(
        'Thanks. Please quickly review the form on the right. Once it looks good, press confirm booking.'
      );
      return;
    }
  }

  async function startRecording() {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());

        // Send audio to Whisper for speech-to-text
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setListening(true);
    } catch (err) {
      console.error('Recording error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please check your microphone.');
      } else {
        setError('Failed to start recording. Please try again.');
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setListening(false);
      setProcessing(true);
    }
  }

  async function transcribeAudio(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription request failed');
      }

      const data = await response.json();

      if (data.success && data.text) {
        const transcript = data.text;
        setVoiceLog((prev) => [...prev, { from: 'user', text: transcript }]);
        handleTranscript(transcript);
      } else {
        throw new Error('No transcript received');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  function toggleListening() {
    if (!supportsRecording) return;

    if (listening) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  async function fetchWeatherSuggestion(date, loc) {
    try {
      const resp = await fetch(
        `/api/weather?date=${encodeURIComponent(date)}&location=${encodeURIComponent(
          loc
        )}`
      );
      if (!resp.ok) {
        throw new Error('Weather fetch failed');
      }
      const data = await resp.json();
      setWeatherSuggestion(data.suggestion || '');
      return data;
    } catch (e) {
      console.error(e);
      setWeatherSuggestion('');
      return null;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setToast('');

    if (!customerName || !numberOfGuests || !bookingDate || !bookingTime) {
      setError('Please fill name, guests, date, and time.');
      return;
    }

    setLoading(true);
    try {
      const weather = await fetchWeatherSuggestion(bookingDate, location);

      let autoSeating = seatingPreference;
      if (weather?.condition === 'sunny') {
        autoSeating = 'outdoor';
      } else if (weather?.condition === 'rainy') {
        autoSeating = 'indoor';
      }

      const body = {
        customerName,
        numberOfGuests: Number(numberOfGuests),
        bookingDate,
        bookingTime,
        cuisinePreference,
        specialRequests,
        weatherInfo: weather,
        seatingPreference: autoSeating
      };

      const resp = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const saved = await resp.json();

      if (!resp.ok) {
        // Oops, too many people for this time slot
        if (saved.error === 'CAPACITY_EXCEEDED') {
          setError(saved.message);
          askNext(saved.message);
          return;
        }
        throw new Error(saved.error || 'Failed to create booking');
      }
      setToast('Booking confirmed!');

      const spoken =
        `All set, ${customerName}. Your booking has been confirmed for ${numberOfGuests} guests ` +
        `on ${bookingDate} at ${bookingTime}. ` +
        (cuisinePreference ? `Cuisine preference: ${cuisinePreference}. ` : '') +
        (autoSeating !== 'unspecified'
          ? `I recommend ${autoSeating} seating. `
          : '');

      setVoiceLog((prev) => [...prev, { from: 'agent', text: spoken }]);

      if (supportsTTS) {
        speak(spoken);
      }

      setStep('name');
      setCustomerName('');
      setLocation('');
      setNumberOfGuests('');
      setBookingDate('');
      setBookingTime('');
      setCuisinePreference('');
      setSpecialRequests('');
    } catch (err) {
      console.error(err);
      setError('Failed to confirm booking. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const currentStepLabel =
    step === 'name'
      ? 'Name'
      : step === 'city'
        ? 'City'
        : step === 'guests'
          ? 'Guests'
          : step === 'datetime'
            ? 'Date & time'
            : step === 'cuisine'
              ? 'Cuisine'
              : step === 'special'
                ? 'Special requests'
                : 'Confirm';

  return (
    <div className="app-container">
      <div>
        <h1>Restaurant Voice Agent</h1>
        <div className="subtitle">
          Talk to the agent to collect booking details, check weather, and
          confirm your table.
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Voice Console</div>
            <span className="pill">English · Whisper (Offline STT)</span>
          </div>
          <div
            className="voice-console"
            ref={consoleRef}
            aria-label="Voice conversation log"
          >
            {voiceLog.map((m, idx) => (
              <div key={idx} className="msg">
                <div className="msg-label">
                  {m.from === 'agent' ? 'Agent' : 'You'}
                </div>
                <div
                  className={
                    'msg-bubble ' + (m.from === 'agent' ? 'agent' : 'user')
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="controls">
            <button
              className={'mic-btn ' + (listening ? 'listening' : '')}
              onClick={toggleListening}
              disabled={!supportsRecording || processing}
              aria-label="Toggle voice listening"
            >
              {listening ? '■' : '🎙'}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                askNext(
                  'Sure. Let\'s start over. Please tell me your name.'
                );
                setStep('name');
                setCustomerName('');
                setLocation('');
                setNumberOfGuests('');
                setBookingDate('');
                setBookingTime('');
                setCuisinePreference('');
                setSpecialRequests('');
                setError('');
                setToast('');
              }}
            >
              <span>↺</span> Restart flow
            </button>
            <div className="status-row">
              <span
                className={'dot ' + (supportsRecording ? '' : 'offline')}
              ></span>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                {supportsRecording
                  ? processing
                    ? 'Processing...'
                    : listening
                      ? 'Recording...'
                      : 'Ready for your voice command'
                  : 'Recording not available'}
              </span>
            </div>
          </div >
          <div className="tag-row">
            <span className="tag">Step: {currentStepLabel}</span>
            {!supportsRecording && (
              <span className="tag">
                Recording unsupported – you can still fill the form.
              </span>
            )}
            {!supportsTTS && (
              <span className="tag">
                TTS unsupported – responses will be text only.
              </span>
            )}
          </div>
        </div >
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Weather Hint</div>
            <span className="badge">Powered by WeatherAPI.com</span>
          </div>
          <div className="card-body">
            {weatherSuggestion ? (
              <span>{weatherSuggestion}</span>
            ) : (
              <span className="small">
                After you pick a date and city, we&apos;ll fetch the forecast to
                help choose indoor or outdoor seating.
              </span>
            )}
          </div>
        </div>
      </div >

      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Booking Details</div>
            <span className="pill">Voice-only mode</span>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <div>
              <div className="field-label">Your name *</div>
              <input
                value={customerName}
                readOnly
                disabled
                placeholder="Voice-filled"
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
            <div className="field-row">
              <div style={{ flex: 1 }}>
                <div className="field-label">Guests *</div>
                <input
                  type="number"
                  min="1"
                  value={numberOfGuests}
                  readOnly
                  disabled
                  placeholder="Voice-filled"
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div className="field-label">City / Location *</div>
                <input
                  value={location}
                  readOnly
                  disabled
                  placeholder="Voice-filled"
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
            </div>
            <div className="field-row">
              <div style={{ flex: 1 }}>
                <div className="field-label">Date *</div>
                <input
                  type="date"
                  value={bookingDate}
                  readOnly
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div className="field-label">Time *</div>
                <input
                  value={bookingTime}
                  readOnly
                  disabled
                  placeholder="Voice-filled"
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
            </div>
            <div>
              <div className="field-label">Cuisine preference</div>
              <input
                value={cuisinePreference}
                readOnly
                disabled
                placeholder="Voice-filled (optional)"
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <div className="field-label">Special requests</div>
              <textarea
                value={specialRequests}
                readOnly
                disabled
                placeholder="Voice-filled (optional)"
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <div className="field-label">
                Seating preference (optional override)
              </div>
              <select
                value={seatingPreference}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              >
                <option value="unspecified">Let agent suggest</option>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
              </select>
              <div className="small">
                If left as &quot;Let agent suggest&quot;, we&apos;ll choose
                based on the weather forecast.
              </div>
            </div>
            {error && <div className="toast error">{error}</div>}
            {toast && <div className="toast">{toast}</div>}
            <button className="submit-btn" disabled={loading}>
              {loading ? 'Confirming...' : 'Confirm booking'}
            </button>
          </form>
          <div className="divider"></div>
          <div className="small">
            This demo keeps everything local and free, using your browser&apos;s
            speech capabilities and a Node.js + MongoDB backend.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Tech Status</div>
            <span className="pill warn">Python ML stub only</span>
          </div>
          <div className="card-body">
            <div>Backend: Node.js + Express + MongoDB</div>
            <div>Weather: WeatherAPI.com forecast endpoint</div>
            <div>Voice STT: Whisper (offline, no internet needed)</div>
            <div>Voice TTS: Web Speech Synthesis (offline)</div>
            <div className="small" style={{ marginTop: 6 }}>
              A separate Python service can be wired in for richer
              natural-language understanding using your Gemini API key or local
              Llama 2 via Ollama.
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}


