# Restaurant Voice Agent - Complete Setup Guide

Get your Restaurant Booking Voice Agent up and running from scratch! This guide covers everything you need on a fresh Windows machine.

## 📋 What You'll Need

### Required Software
- **Node.js** v18+ with npm - JavaScript runtime for frontend & backend
- **Python** 3.8+ - For the ML service
- **MongoDB** - Database for storing bookings (local or cloud)
- **Ollama** - Runs Llama2 AI model locally (no API keys!)

### API Keys (Optional but Recommended)
- **WeatherAPI.com** - Free tier for weather forecasts
  - Sign up: https://www.weatherapi.com/signup.aspx
  - The app works without it, but you won't get weather-based seating suggestions

---

## 🚀 Step-by-Step Setup

### Step 1: Install Required Software

#### 1.1 Install Node.js
1. Download from https://nodejs.org/ (LTS version recommended)
2. Run installer and follow prompts
3. Verify installation:
   ```powershell
   node --version  # Should show v18.x.x or higher
   npm --version   # Should show 9.x.x or higher
   ```

#### 1.2 Install Python
1. Download from https://www.python.org/downloads/
2. **Important:** Check "Add Python to PATH" during installation
3. Verify installation:
   ```powershell
   python --version  # Should show Python 3.8+
   pip --version     # Should show pip version
   ```

#### 1.3 Install MongoDB

**Option A: Local MongoDB (Recommended for Development)**
1. Download from https://www.mongodb.com/try/download/community
2. Install as a Windows Service (recommended)
3. Start MongoDB:
   ```powershell
   net start MongoDB
   ```
4. Verify it's running:
   ```powershell
   mongod --version
   ```

**Option B: MongoDB Atlas (Cloud - Free Tier)**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string (looks like: `mongodb+srv://username:password@cluster...`)
4. You'll use this in the `.env` file later

#### 1.4 Install Ollama
1. Download from https://ollama.ai/download
2. Run installer
3. Ollama will start automatically as a service
4. Pull the Llama2 model (this is a ~4GB download):
   ```powershell
   ollama pull llama2
   ```
5. Verify Ollama is working:
   ```powershell
   ollama list  # Should show llama2:latest
   ```

---

### Step 2: Get the Project Code

If you don't have it yet:
```powershell
# Navigate to where you want the project
cd C:\Users\YourName\Projects

# Clone or extract the project
# (Assuming you already have the files)
cd "VAIU Assessment"
```

---

### Step 3: Install Project Dependencies

Open PowerShell or Command Prompt in the project root directory.

#### 3.1 Install Backend Dependencies
```powershell
cd backend
npm install
```

This installs:
- Express (web framework)
- Mongoose (MongoDB connection)
- Axios (HTTP requests)
- And other backend dependencies

#### 3.2 Install Frontend Dependencies
```powershell
cd ../frontend
npm install
```

This installs:
- React (UI framework)
- Vite (dev server)
- And other frontend dependencies

#### 3.3 Install ML Service Dependencies
```powershell
cd ../ml-service
pip install -r requirements.txt
```

This installs:
- FastAPI (Python web framework)
- Whisper (offline speech-to-text)
- And other ML dependencies

**Note:** The first time you run the ML service, it will download the Whisper model (~150MB). This is a one-time download.

```powershell
# Go back to project root
cd ..
```

---

### Step 4: Configure Environment Variables

#### 4.1 Copy the Example .env File
The project should already have a `.env` file. If not, create one in the project root:

```powershell
# Create .env file in project root
New-Item -Path ".env" -ItemType File
```

#### 4.2 Edit the .env File
Open `.env` in a text editor and configure:

```env
PORT=3001

# MongoDB - where we store all the bookings
# Local: mongodb://localhost:27017/
# Cloud (Atlas): mongodb+srv://username:password@cluster.mongodb.net/restaurant-bookings
MONGODB_URL=mongodb://localhost:27017/restaurant-bookings

# Weather API - get forecasts from WeatherAPI.com
# Sign up at https://www.weatherapi.com/ for a free key
# Don't worry if you skip this - the app will still work without weather features
WEATHER_API_KEY=your_api_key_here

ML_PORT=5001
```

**Configuration Notes:**
- If using **local MongoDB**: Keep `MONGODB_URL=mongodb://localhost:27017/restaurant-bookings`
- If using **MongoDB Atlas**: Replace with your connection string
- **Weather API Key**: Optional - get from https://www.weatherapi.com/signup.aspx
- Ports: Default ports should work, change only if there's a conflict

#### 4.3 Copy .env to Backend Directory
The backend also needs access to these variables:

```powershell
# Copy .env to backend folder
Copy-Item .env backend\.env
```

---

### Step 5: Start All Services

You'll need **THREE separate terminal windows** - one for each service.

#### Terminal 1: Start the ML Service (Python)
```powershell
cd ml-service
python app.py
```

Wait for:
```
✅ Whisper model loaded successfully!
╔═══════════════════════════════════════════════════════════╗
║  Restaurant Voice Agent ML Service                        ║
║  Using: Ollama Llama2 (Offline LLM)                      ║
║  Port: 5001                                               ║
╚═══════════════════════════════════════════════════════════╝
```

✅ **ML Service running**: http://localhost:5001

#### Terminal 2: Start the Backend (Node.js)
```powershell
cd backend
npm start
```

Wait for:
```
Connected to MongoDB
Server listening on port 3001
```

✅ **Backend running**: http://localhost:3001

#### Terminal 3: Start the Frontend (React)
```powershell
cd frontend
npm run dev
```

Wait for:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ **Frontend running**: http://localhost:5173

---

### Step 6: Test the Application

1. **Open your browser** to http://localhost:5173
2. **Allow microphone permissions** when prompted
3. **Click the microphone button** 🎙
4. **Speak**: "My name is John"
5. **Follow the voice prompts** to complete a booking

The agent will guide you through:
- Name → City → Number of guests → Date & time → Cuisine → Special requests → Confirm

---

## 🧪 Verification & Testing

### Quick Health Check

Run these commands to verify all services are working:

```powershell
# Check Ollama
curl http://localhost:11434/api/tags

# Check ML Service
curl http://localhost:5001/health

# Check Backend
curl http://localhost:3001/api/bookings

# Frontend should load in browser
# http://localhost:5173
```

### Test Weather API (Optional)

If you configured a weather API key:

```powershell
python weather_test.py
```

You should see:
```
✅ SUCCESS! Weather API is working correctly!
```

---

## 🔧 Common Issues & Solutions

### Issue: "Port already in use"

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr :3001

# Kill the process (replace <PID> with the actual process ID)
taskkill /PID <PID> /F

# Or restart the terminal and try again
```

---

### Issue: "MongoDB connection failed"

**Error:**
```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**

1. **Check if MongoDB is running:**
   ```powershell
   # Start MongoDB service
   net start MongoDB
   ```

2. **If using MongoDB Atlas**, verify your connection string in `.env`

3. **Check MongoDB is installed:**
   ```powershell
   mongod --version
   ```

---

### Issue: "Ollama not responding"

**Error:**
```
❌ Could not connect to Ollama
```

**Solutions:**

1. **Check Ollama is installed:**
   ```powershell
   ollama --version
   ```

2. **Make sure llama2 model is downloaded:**
   ```powershell
   ollama pull llama2
   ollama list  # Should show llama2:latest
   ```

3. **Restart Ollama service:**
   - On Windows, Ollama runs as a background service
   - Check Task Manager for "Ollama" process
   - Or visit http://localhost:11434 in browser (should show "Ollama is running")

---

### Issue: "Microphone not working"

**Error:**
```
Microphone permission denied
```

**Solutions:**

1. **Grant browser permissions:**
   - Click the lock icon in address bar
   - Allow microphone access
   - Refresh the page

2. **Use a supported browser:**
   - ✅ Chrome (best)
   - ✅ Edge (best)
   - ⚠️ Firefox (limited support)
   - ❌ Safari (not recommended)

3. **Test your microphone:**
   - Open Windows Sound Settings
   - Speak and watch the input levels
   - Make sure the correct mic is selected

---

### Issue: "Python module not found"

**Error:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```powershell
cd ml-service
pip install -r requirements.txt

# If that doesn't work, try:
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

---

### Issue: "npm install fails"

**Error:**
```
npm ERR! code ELIFECYCLE
```

**Solutions:**

1. **Clear npm cache:**
   ```powershell
   npm cache clean --force
   npm install
   ```

2. **Delete node_modules and try again:**
   ```powershell
   rmdir /s /q node_modules
   del package-lock.json
   npm install
   ```

---

## 🔄 Starting Fresh (Reset Everything)

If things are really messed up, start from scratch:

```powershell
# 1. Stop all running services (Ctrl+C in each terminal)

# 2. Kill any stuck processes
taskkill /F /IM node.exe
taskkill /F /IM python.exe

# 3. Clean backend
cd backend
rmdir /s /q node_modules
del package-lock.json
npm install

# 4. Clean frontend
cd ../frontend
rmdir /s /q node_modules
del package-lock.json
npm install

# 5. Clean ML service
cd ../ml-service
pip uninstall -r requirements.txt -y
pip install -r requirements.txt

# 6. Restart MongoDB
net stop MongoDB
net start MongoDB

# 7. Restart all services (see Step 5)
```

---

## 📊 Service Architecture

Here's what runs where:

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend** | 5173 | http://localhost:5173 | React UI - what you see |
| **Backend** | 3001 | http://localhost:3001 | Node.js API - handles bookings |
| **ML Service** | 5001 | http://localhost:5001 | Python - AI & speech recognition |
| **Ollama** | 11434 | http://localhost:11434 | Llama2 AI model server |
| **MongoDB** | 27017 | mongodb://localhost:27017 | Database |

---

## ✅ Success Checklist

Before you say "it works!", make sure:

- [ ] Node.js installed (`node --version` works)
- [ ] Python installed (`python --version` works)
- [ ] MongoDB running (`net start MongoDB` or Atlas configured)
- [ ] Ollama installed and llama2 pulled (`ollama list` shows llama2)
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] ML service dependencies installed (`cd ml-service && pip install -r requirements.txt`)
- [ ] `.env` file configured (MongoDB URL at minimum)
- [ ] `.env` copied to backend directory
- [ ] ML Service running on port 5001 ✅
- [ ] Backend running on port 3001 ✅
- [ ] Frontend running on port 5173 ✅
- [ ] Ollama running on port 11434 ✅
- [ ] Can access http://localhost:5173 in browser
- [ ] Microphone permissions granted
- [ ] Can complete a full booking with voice

---

## 🎉 You're All Set!

Once everything is checked off, you should be able to:
- Open http://localhost:5173
- Click the microphone
- Book a table using only your voice!

The agent will guide you through the entire process, from collecting your name to confirming the booking.

---

## 💡 Pro Tips

### Faster Startup (After First Setup)

Create a startup script `start-all.bat`:

```batch
@echo off
echo Starting Restaurant Voice Agent...

start cmd /k "cd ml-service && python app.py"
timeout /t 3
start cmd /k "cd backend && npm start"
timeout /t 3
start cmd /k "cd frontend && npm run dev"

echo All services starting!
echo Check each terminal window for status.
```

Run this file to start all three services at once!

### Development Mode

For faster development with auto-reload:

**Backend:**
```powershell
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Check What's Running

Quick way to see all your services:

```powershell
# Check all ports at once
netstat -ano | findstr "3001 5001 5173 11434 27017"
```

---

## 🆘 Still Having Issues?

### Check Logs

- **Backend logs**: Shown in the terminal where you ran `npm start`
- **Frontend logs**: Browser console (F12 → Console tab)
- **ML Service logs**: Terminal where you ran `python app.py`
- **MongoDB logs**: `%ProgramData%\MongoDB\log\mongod.log`

### System Requirements

Make sure your PC meets minimum requirements:
- **OS**: Windows 10/11
- **RAM**: 8GB+ (16GB recommended for Ollama)
- **Disk**: 10GB free space (for models)
- **Network**: Internet for initial setup only

### Get Help

Common places to check:
- Ollama documentation: https://ollama.ai/
- MongoDB documentation: https://docs.mongodb.com/
- FastAPI documentation: https://fastapi.tiangolo.com/

---

## 🌟 What Makes This Special

- **🎙 100% Voice-Driven** - No typing needed
- **🔒 Completely Offline AI** - Llama2 runs locally, no data sent to cloud
- **⚡ Fast & Free** - No API quotas or rate limits
- **🌦 Weather-Smart** - Suggests indoor/outdoor seating based on forecast
- **🗣 Natural Conversations** - Understands casual speech
- **💾 Persistent Storage** - All bookings saved in MongoDB

---

**Happy Booking! 🎉**
