const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { date, location } = req.query;

    if (!date || !location) {
      return res.status(400).json({ error: 'date and location are required' });
    }

    const apiKey =
      process.env.WEATHER_API_KEY ||
      process.env.weather_api_key ||
      process.env.WEATHERAPI_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    // WeatherAPI.com needs an API key - let's grab it from the environment
    const url = `https://api.weatherapi.com/v1/forecast.json`;

    const response = await axios.get(url, {
      params: {
        key: apiKey,
        q: location,
        dt: date
      }
    });

    const forecast = response.data;

    const day = forecast.forecast?.forecastday?.[0]?.day;

    let condition = 'unknown';
    if (day) {
      const text = (day.condition?.text || '').toLowerCase();
      if (text.includes('sun') || text.includes('clear')) {
        condition = 'sunny';
      } else if (
        text.includes('rain') ||
        text.includes('drizzle') ||
        text.includes('storm')
      ) {
        condition = 'rainy';
      } else if (text.includes('cloud')) {
        condition = 'cloudy';
      } else {
        condition = 'mixed';
      }
    }

    let suggestion;
    if (condition === 'sunny') {
      suggestion =
        'The weather looks great! Outdoor seating would be a lovely choice.';
    } else if (condition === 'rainy') {
      suggestion =
        'It might rain. I recommend our cozy indoor seating for a comfortable experience.';
    } else if (condition === 'cloudy') {
      suggestion =
        'It looks a bit cloudy. Both indoor and outdoor seating are possible depending on your preference.';
    } else {
      suggestion =
        'The forecast is a bit uncertain. Indoor seating is the safer option, but we can do outdoor if you prefer.';
    }

    return res.json({
      raw: forecast,
      condition,
      suggestion
    });
  } catch (err) {
    console.error('Error fetching weather:', err.message);
    return res.status(500).json({ error: 'Failed to fetch weather information' });
  }
});

module.exports = router;


