# 🎙️ Restaurant Voice Agent

> **Book restaurant tables using only your voice - powered by AI, completely offline and free!**

A full-stack voice-enabled restaurant booking system that lets customers make reservations through natural conversation. No typing, no forms - just talk!

---

## ✨ Features

### 🗣️ Voice-First Experience
- **100% voice-driven** - From name to confirmation, no manual input needed
- **Natural language** - Speak naturally, the AI understands casual speech
- **Real-time feedback** - Instant voice responses guide you through booking
- **Smart extraction** - Automatically pulls dates, times, and preferences from speech

### 🤖 AI-Powered Intelligence
- **Offline AI** - Llama2 via Ollama runs locally, no internet required
- **Context-aware** - Remembers the conversation flow
- **Intent recognition** - Understands what you want even with natural speech
- **Slot filling** - Extracts booking details intelligently

### 🌦️ Smart Features
- **Weather integration** - Fetches real forecasts from WeatherAPI.com
- **Seating suggestions** - Recommends indoor/outdoor based on weather
- **Capacity management** - Prevents overbooking (max 30 guests per hour)
- **Dietary validation** - Uses AI to check special requests make sense

### 🔒 Privacy & Performance
- **Completely offline** - Speech recognition runs in your browser
- **No API quotas** - Unlimited usage, no rate limits
- **Local data** - Everything stored in your MongoDB
- **Fast responses** - No cloud latency

---

## 🎬 How It Works

1. **Click the microphone** 🎙️
2. **Say your name** - "Hi, I'm Sarah"
3. **Tell us the city** - "I'd like to book in London"
4. **Number of guests** - "Table for 4 please"
5. **Pick date & time** - "Tomorrow at 7 pm"
6. **Choose cuisine** - "Italian food"
7. **Special requests** - "Celebrating an anniversary" or "No special requests"
8. **Confirm** - Review and finalize your booking

The agent speaks back at each step, guiding you through the process!

---

## 🛠️ Tech Stack

### Frontend
- **React** - Modern UI framework
- **Vite** - Lightning-fast dev server
- **Web Speech API** - Browser-native speech recognition
- **Speech Synthesis** - Text-to-speech for agent responses

### Backend
- **Node.js** + **Express** - REST API server
- **MongoDB** - Booking database
- **Mongoose** - MongoDB object modeling
- **Axios** - HTTP requests for weather API

### ML Service (Python)
- **FastAPI** - High-performance Python web framework
- **Whisper** (faster-whisper) - Offline speech-to-text
- **Ollama** + **Llama2** - Offline large language model
- **Intent recognition** - Extracts booking details from conversation

### APIs & Services
- **WeatherAPI.com** - Real-time weather forecasts (optional)
- **MongoDB Atlas** - Cloud database option (optional)

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Python 3.8+
- MongoDB (local or Atlas) # just download monogdb and create a db , edit connection url and set the connection url in .env 
- Ollama with Llama2 model

### Installation

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../ml-service && pip install -r requirements.txt

# 2. Set up environment variables
# Edit .env file in project root with your MongoDB URL and Weather API key

# 3. Start all services (in separate terminals)
cd ml-service && python app.py        # Terminal 1
cd backend && npm start                # Terminal 2
cd frontend && npm run dev             # Terminal 3

# 4. Open browser to http://localhost:5173
```

**Need detailed help?** See **[SETUP.md](./SETUP.md)** for complete installation guide.

---

## 📂 Project Structure

```
VAIU Assessment/
├── backend/                # Node.js + Express API server
│   ├── src/
│   │   ├── models/        # MongoDB schemas
│   │   │   └── Booking.js
│   │   └── routes/        # API endpoints
│   │       ├── bookings.js
│   │       └── weather.js
│   ├── server.js          # Main server file
│   └── package.json
│
├── frontend/              # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   └── package.json
│
├── ml-service/            # Python ML service
│   ├── app.py             # FastAPI server with Whisper & Llama2
│   └── requirements.txt
│
├── .env                   # Environment variables
├── SETUP.md              # Detailed setup instructions
└── README.md             # This file
```

---

## 🎯 API Endpoints

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get specific booking
- `POST /api/bookings` - Create new booking
- `DELETE /api/bookings/:id` - Cancel booking

### Weather
- `GET /api/weather?date=YYYY-MM-DD&location=City` - Get weather forecast

### ML Service
- `POST /transcribe` - Convert speech to text (Whisper)
- `POST /interpret` - Extract intent and slots (Llama2)
- `POST /validate_request` - Validate special requests
- `GET /health` - Check service status

---

## 💡 Usage Examples

### Booking Schema
```json
{
  "bookingId": "uuid-v4-string",
  "customerName": "Sarah Johnson",
  "numberOfGuests": 4,
  "bookingDate": "2025-12-15",
  "bookingTime": "7 pm",
  "location": "London",
  "cuisinePreference": "Italian",
  "specialRequests": "Anniversary celebration",
  "weatherInfo": {
    "condition": "sunny",
    "suggestion": "Perfect weather for outdoor dining!"
  },
  "seatingPreference": "outdoor",
  "status": "confirmed"
}
```

### Voice Conversation Example
```
Agent: Hi! I can help you book a table. Please tell me your name.
User: My name is John Smith
Agent: Nice to meet you, John Smith. Which city would you like to book in?
User: London
Agent: Great! London it is. How many guests will be joining you?
User: Four people
Agent: Got it. On which date and at what time would you like to book?
User: December 25th at 7 PM
Agent: Perfect. What kind of cuisine do you prefer? We offer Italian, Indian, or Chinese.
User: Italian
Agent: Excellent choice. Any special requests?
User: It's my anniversary
Agent: How wonderful! Please review your booking and confirm.
[User clicks Confirm]
Agent: All set! Your booking for 4 guests on December 25th at 7:30 PM is confirmed. 
      Booking ID: abc-123-def. Enjoy your anniversary dinner!
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3001
MONGODB_URL=mongodb://localhost:27017/restaurant-bookings
WEATHER_API_KEY=your_weatherapi_key_here #get a weather API key from weatherapi.com
ML_PORT=5001
```

**Important:**
- `MONGODB_URL` - Required for storing bookings
- `WEATHER_API_KEY` - Optional (app works without it, uses mock data)
- Copy `.env` to `backend/.env` as well

---

## 🌐 Browser Support

### Speech Recognition
- ✅ **Chrome** - Full support (recommended)
- ✅ **Edge** - Full support (recommended)
- ⚠️ **Firefox** - Limited support
- ❌ **Safari** - Not recommended

### Text-to-Speech
- ✅ All modern browsers support Web Speech Synthesis API

---

## 🎨 Features Breakdown

### Voice Recognition Flow
1. **Browser captures audio** via MediaRecorder API
2. **Audio sent to ML service** as webm/mp4
3. **Whisper transcribes** to text (offline)
4. **Frontend parses** and extracts information
5. **Agent responds** with next question via TTS

### Intent & Slot Extraction
```python
# Using Llama2 via Ollama
User: "I'd like to book a table for 4 next Friday at 7 pm"

Extracted:
{
  "intent": "book_table",
  "numberOfGuests": 4,
  "date": "2025-12-13",  # Next Friday
  "time": "7 pm"
}
```

### Weather-Based Suggestions
```python
if weather.condition == "sunny":
    seating = "outdoor"
    suggestion = "Perfect weather for outdoor dining!"
elif weather.condition == "rainy":
    seating = "indoor"
    suggestion = "It might rain. Indoor seating recommended."
```

---

## 🐛 Troubleshooting

### Common Issues

**Microphone not working?**
- Check browser permissions (click lock icon in address bar)
- Use Chrome or Edge for best results
- Test microphone in Windows Sound Settings

**MongoDB connection failed?**
- Make sure MongoDB is running: `net start MongoDB`
- Check connection string in `.env`

**Ollama not responding?**
- Verify Llama2 is installed: `ollama list`
- Pull if missing: `ollama pull llama2`

**Port conflicts?**
- Check what's using the port: `netstat -ano | findstr :3001`
- Kill process or use different port in `.env`

For detailed troubleshooting, see **[SETUP.md](./SETUP.md)**.

---

## 📊 System Requirements

### Minimum
- Windows 10/11
- 8GB RAM
- 10GB free disk space
- Internet (for initial setup only)

### Recommended
- Windows 11
- 16GB RAM (for smooth Ollama performance)
- 20GB free disk space
- Microphone

---

## 🔐 Privacy & Security

- **All speech processing happens locally** - No audio sent to cloud
- **Llama2 runs on your machine** - No external API calls
- **MongoDB is local** - Your data never leaves your computer
- **Optional weather API** - Only sends date & location (no personal info)

---

## 🎓 Learning Resources

Built with these amazing technologies:

- **React**: https://react.dev/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Whisper**: https://github.com/openai/whisper
- **Ollama**: https://ollama.ai/
- **MongoDB**: https://docs.mongodb.com/

---

## 🚧 Known Limitations

- **3 cuisines** - Italian, Indian, Chinese (can be extended)
- **Browser-dependent** - Speech recognition quality varies by browser
- **Capacity limit** - 30 guests per hour (configurable in code)

---


## 🤝 Contributing

This is an assessment project, but suggestions are welcome!

To contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

---



**Tech Stack:** React + Node.js + Python + MongoDB + Ollama + Whisper

---

**Made with ❤️ and lots of ☕**
