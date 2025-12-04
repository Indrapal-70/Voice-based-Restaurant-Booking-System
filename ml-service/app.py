from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import requests
import json
import os
import uvicorn
from faster_whisper import WhisperModel
import tempfile


class Message(BaseModel):
    role: str
    content: str


class InterpretRequest(BaseModel):
    history: List[Message]
    locale: Optional[str] = "en"


class InterpretResponse(BaseModel):
    reply: str
    intent: str
    slots: dict


app = FastAPI(
    title="Restaurant Voice Agent ML Service",
    description=(
        "Python ML service for intent + slot extraction. "
        "Uses local Llama2 via Ollama - completely offline, no API keys needed!"
    ),
    version="0.2.0",
)

# Load up Whisper for speech-to-text - happens once when the service starts
print("Loading Whisper base model... (this may take a moment on first run)")
whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
print("✅ Whisper model loaded successfully!")


def call_ollama_llama2(prompt: str) -> str:
    """
    Talk to Llama2 running locally via Ollama.
    This is how we understand what the user wants - no API keys, totally offline!
    """
    try:
        url = "http://localhost:11434/api/generate"
        payload = {
            "model": "llama2",
            "prompt": prompt,
            "stream": False
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return result.get('response', '').strip()
        else:
            print(f"Ollama API error: {response.status_code}")
            return ""
            
    except Exception as exc:
        print("Ollama call failed:", exc)
        print("💡 Make sure Ollama is running: ollama serve")
        print("💡 And Llama2 is installed: ollama pull llama2")
        return ""


@app.post("/interpret", response_model=InterpretResponse)
def interpret(req: InterpretRequest):
    """
    Figure out what the user wants from the conversation.
    Uses Llama2 if available, otherwise falls back to simple keyword matching.
    """
    history_text = " ".join([m.content for m in req.history]).lower()

    # Ask Llama2 to extract booking details from the conversation
    llama_prompt = f"""You are a restaurant booking assistant. Analyze this conversation and extract booking information.

Conversation: {history_text}

Extract the following in JSON format:
{{
    "intent": "book_table" or "unknown",
    "numberOfGuests": number or null,
    "date": date string or null,
    "time": time string or null,
    "cuisine": cuisine preference or null
}}

Reply with ONLY the JSON, no other text."""

    llama_response = call_ollama_llama2(llama_prompt)
    
    # See if Llama2 gave us something useful
    intent = "unknown"
    slots = {}
    
    if llama_response:
        try:
            # Extract the JSON part from Llama2's response
            json_start = llama_response.find('{')
            json_end = llama_response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = llama_response[json_start:json_end]
                parsed = json.loads(json_str)
                
                intent = parsed.get('intent', 'unknown')
                
                # Pull out the booking details Llama2 found
                if parsed.get('numberOfGuests'):
                    slots['numberOfGuests'] = parsed['numberOfGuests']
                if parsed.get('date'):
                    slots['date'] = parsed['date']
                if parsed.get('time'):
                    slots['time'] = parsed['time']
                if parsed.get('cuisine'):
                    slots['cuisine'] = parsed['cuisine']
                    
        except Exception as e:
            print(f"Failed to parse Llama2 response: {e}")
            # Llama2's response wasn't valid JSON, no worries - we'll use simple rules
            pass
    
    # If Llama2 couldn't help, use basic pattern matching
    if intent == "unknown":
        if "book" in history_text or "table" in history_text or "reservation" in history_text:
            intent = "book_table"
        
        # Just look for numbers and keywords - simple but effective
        for token in history_text.split():
            if token.isdigit() and 'numberOfGuests' not in slots:
                slots["numberOfGuests"] = int(token)
                break

    reply = (
        "I understand you want to book a table. "
        "I will help collect your guest count, date, time, cuisine, and any special requests."
    )

    return InterpretResponse(reply=reply, intent=intent, slots=slots)


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Turn audio into text using Whisper.
    Works with webm, wav, mp3, and other common audio formats.
    """
    try:
        # Save the audio to a temp file so Whisper can process it
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            # Let Whisper do its magic
            segments, info = whisper_model.transcribe(tmp_path, language="en")
            
            # Put all the transcribed pieces together
            text = " ".join([segment.text for segment in segments]).strip()
            
            return {
                "success": True,
                "text": text,
                "language": info.language,
                "language_probability": info.language_probability
            }
        finally:
            # Clean up the temp file we created
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                
    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@app.post("/validate_request")
async def validate_special_request(request: dict):
    """
    Check if a special request makes sense (allergies, dietary needs, celebrations, etc.).
    Uses Llama2 to filter out nonsense while accepting legitimate requests.
    """
    try:
        special_request = request.get("text", "").strip()
        
        if not special_request:
            return {"valid": True, "reason": "No special request provided"}
        
        # If someone said "no special requests", that's fine
        lower_text = special_request.lower()
        if "no special" in lower_text or "no request" in lower_text or "none" in lower_text:
            return {"valid": True, "reason": "No special requests"}
        
        # Ask Llama2 if this request is reasonable
        prompt = f"""You are a restaurant booking assistant. Analyze if this special request is valid.

Special Request: "{special_request}"

Valid requests include:
- Allergies (nut allergy, shellfish allergy, lactose intolerant, etc.)
- Medical conditions (diabetes, celiac disease, etc.)
- Dietary restrictions (vegetarian, vegan, halal, kosher, gluten-free, etc.)
- Special occasions (birthday, anniversary)
- Accessibility needs (wheelchair access, high chair needed)

Invalid requests include:
- Unrelated demands
- Inappropriate requests
- Nonsense text

Respond with ONLY "VALID" or "INVALID" followed by a brief reason.
Format: VALID: [reason] OR INVALID: [reason]"""

        llama_response = call_ollama_llama2(prompt)
        
        if llama_response:
            response_lower = llama_response.lower()
            
            # See what Llama2 thinks
            if "valid:" in response_lower and "invalid" not in response_lower:
                return {
                    "valid": True,
                    "reason": llama_response.split(":", 1)[1].strip() if ":" in llama_response else "Accepted"
                }
            elif "invalid:" in response_lower:
                return {
                    "valid": False,
                    "reason": llama_response.split(":", 1)[1].strip() if ":" in llama_response else "Not a valid health/dietary request"
                }
        
        # If Llama2 didn't respond clearly, let the request through
        return {"valid": True, "reason": "Unable to validate, accepting request"}
        
    except Exception as e:
        print(f"Validation error: {e}")
        # Better to accept requests than block customers when things break
        return {"valid": True, "reason": "Validation service unavailable"}


@app.get("/health")
def health_check():
    """Quick check to see if Ollama is running"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        ollama_status = "running" if response.status_code == 200 else "error"
    except:
        ollama_status = "offline"
    
    return {
        "status": "online",
        "ollama": ollama_status,
        "model": "llama2"
    }


if __name__ == "__main__":
    port = int(os.getenv("ML_PORT", "5001"))
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║  Restaurant Voice Agent ML Service                        ║
║  Using: Ollama Llama2 (Offline LLM)                      ║
║  Port: {port}                                             ║
╚═══════════════════════════════════════════════════════════╝
    """)
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
