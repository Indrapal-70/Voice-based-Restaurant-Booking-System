import os
import requests
from datetime import datetime, timedelta

# Try to load dotenv if available
try:
    from dotenv import load_dotenv
    # Load environment variables from backend/.env if it exists
    backend_env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
    if os.path.exists(backend_env_path):
        load_dotenv(backend_env_path)
        print(f"✓ Loaded environment from: {backend_env_path}")
    else:
        print(f"⚠ No .env file found at: {backend_env_path}")
        print("  Looking for environment variables in system...")
except ImportError:
    print("⚠ python-dotenv not installed, checking system environment only...")

# Try to get the API key from various environment variable names
api_key = (
    os.getenv('WEATHER_API_KEY') or
    os.getenv('weather_api_key') or
    os.getenv('WEATHERAPI_KEY')
)

print("\n" + "="*60)
print("WEATHER API KEY TEST")
print("="*60 + "\n")

if not api_key:
    print("⚠ Weather API key not found in environment variables!")
    print("\n" + "="*60)
    print("HOW TO GET A FREE WEATHER API KEY")
    print("="*60)
    print("\n1. Visit: https://www.weatherapi.com/signup.aspx")
    print("2. Sign up for a FREE account")
    print("3. After login, go to your dashboard")
    print("4. Copy your API key")
    print("\n5. Add it to backend/.env file:")
    print("   WEATHER_API_KEY=your_api_key_here")
    print("\n" + "="*60)
    print("\nFor testing now, you can enter your API key manually:")
    print("(Press Enter to skip manual test)")
    print("-"*60)
    
    api_key = input("Enter your Weather API key: ").strip()
    
    if not api_key:
        print("\n❌ No API key provided. Exiting.")
        exit(1)
    
    print("\nℹ Using manually entered API key for this test only.")
    print("  Remember to add it to backend/.env for your app!")

# Mask the API key for display (show first 8 and last 4 characters)
masked_key = f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else "***"
print(f"✓ API Key found: {masked_key}")
print(f"  Length: {len(api_key)} characters\n")

# Test the API with a sample request
print("Testing API connection...")
print("-" * 60)

# Use tomorrow's date for the test
test_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
test_location = "London"

url = "https://api.weatherapi.com/v1/forecast.json"
params = {
    'key': api_key,
    'q': test_location,
    'dt': test_date
}

try:
    print(f"Request URL: {url}")
    print(f"Parameters:")
    print(f"  - Location: {test_location}")
    print(f"  - Date: {test_date}")
    print(f"  - API Key: {masked_key}\n")
    
    response = requests.get(url, params=params, timeout=10)
    
    print(f"Response Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        print("\n✅ SUCCESS! Weather API is working correctly!\n")
        print("="*60)
        print("WEATHER DATA PREVIEW")
        print("="*60)
        
        # Display location info
        if 'location' in data:
            loc = data['location']
            print(f"\nLocation:")
            print(f"  Name: {loc.get('name', 'N/A')}")
            print(f"  Region: {loc.get('region', 'N/A')}")
            print(f"  Country: {loc.get('country', 'N/A')}")
            print(f"  Timezone: {loc.get('tz_id', 'N/A')}")
        
        # Display forecast info
        if 'forecast' in data and data['forecast'].get('forecastday'):
            day_data = data['forecast']['forecastday'][0]
            day = day_data.get('day', {})
            
            print(f"\nForecast for {day_data.get('date', 'N/A')}:")
            print(f"  Condition: {day.get('condition', {}).get('text', 'N/A')}")
            print(f"  Max Temp: {day.get('maxtemp_c', 'N/A')}°C / {day.get('maxtemp_f', 'N/A')}°F")
            print(f"  Min Temp: {day.get('mintemp_c', 'N/A')}°C / {day.get('mintemp_f', 'N/A')}°F")
            print(f"  Chance of Rain: {day.get('daily_chance_of_rain', 'N/A')}%")
            print(f"  Max Wind: {day.get('maxwind_kph', 'N/A')} kph")
            
            # Determine condition type (same logic as your backend)
            condition_text = (day.get('condition', {}).get('text', '')).lower()
            if 'sun' in condition_text or 'clear' in condition_text:
                condition = 'sunny'
                suggestion = 'The weather looks great! Outdoor seating would be a lovely choice.'
            elif 'rain' in condition_text or 'drizzle' in condition_text or 'storm' in condition_text:
                condition = 'rainy'
                suggestion = 'It might rain. I recommend our cozy indoor seating for a comfortable experience.'
            elif 'cloud' in condition_text:
                condition = 'cloudy'
                suggestion = 'It looks a bit cloudy. Both indoor and outdoor seating are possible depending on your preference.'
            else:
                condition = 'mixed'
                suggestion = 'The forecast is a bit uncertain. Indoor seating is the safer option, but we can do outdoor if you prefer.'
            
            print(f"\n  Condition Type: {condition}")
            print(f"  Suggestion: {suggestion}")
        
        print("\n" + "="*60)
        print("✅ Your Weather API key is working perfectly!")
        print("="*60)
        
    elif response.status_code == 401:
        print("\n❌ AUTHENTICATION ERROR!")
        print("The API key is invalid or inactive.")
        print("\nPossible solutions:")
        print("1. Check if the API key is correct")
        print("2. Ensure the API key is active (check your WeatherAPI.com account)")
        print("3. Get a new API key from: https://www.weatherapi.com/signup.aspx")
        
    elif response.status_code == 403:
        print("\n❌ ACCESS DENIED!")
        print("The API key doesn't have permission to access this endpoint.")
        print("\nCheck your WeatherAPI.com plan limits.")
        
    elif response.status_code == 400:
        error_data = response.json()
        print("\n❌ BAD REQUEST!")
        print(f"Error: {error_data.get('error', {}).get('message', 'Unknown error')}")
        
    else:
        print(f"\n❌ UNEXPECTED ERROR!")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
except requests.exceptions.Timeout:
    print("\n❌ TIMEOUT ERROR!")
    print("The request took too long. Check your internet connection.")
    
except requests.exceptions.ConnectionError:
    print("\n❌ CONNECTION ERROR!")
    print("Could not connect to WeatherAPI.com. Check your internet connection.")
    
except Exception as e:
    print(f"\n❌ UNEXPECTED ERROR!")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")

print("\n" + "="*60)
print("TEST COMPLETE")
print("="*60 + "\n")
