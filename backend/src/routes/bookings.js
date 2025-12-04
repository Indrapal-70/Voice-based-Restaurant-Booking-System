const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      numberOfGuests,
      bookingDate,
      bookingTime,
      location,
      cuisinePreference,
      specialRequests,
      weatherInfo,
      seatingPreference,
      status
    } = req.body;

    // We can handle up to 30 guests per hour - let's check if there's space
    const MAX_CAPACITY = 30;

    // Figure out which hour this booking is for (e.g., "7:30 pm" → hour 7)
    const normalizedTime = bookingTime.toLowerCase().trim();
    const hourMatch = normalizedTime.match(/(\d{1,2})/);
    const hour = hourMatch ? hourMatch[1] : null;

    if (hour) {
      // Find all bookings for the same date and hour
      const existingBookings = await Booking.find({
        bookingDate: new Date(bookingDate),
        // Don't count cancelled bookings towards capacity
      });

      // Filter down to bookings that match this same hour
      const sameHourBookings = existingBookings.filter(booking => {
        const bookingHourMatch = booking.bookingTime.toLowerCase().match(/(\d{1,2})/);
        return bookingHourMatch && bookingHourMatch[1] === hour;
      });

      // Add up all the guests already booked for this hour
      const totalGuestsInHour = sameHourBookings.reduce((sum, booking) => {
        return sum + (booking.numberOfGuests || 0);
      }, 0);

      // Would this booking push us over capacity?
      const newTotal = totalGuestsInHour + numberOfGuests;

      if (newTotal > MAX_CAPACITY) {
        const availableSeats = MAX_CAPACITY - totalGuestsInHour;
        return res.status(400).json({
          error: 'CAPACITY_EXCEEDED',
          message: `Sorry, we can only accommodate ${availableSeats} more guest${availableSeats !== 1 ? 's' : ''} at ${bookingTime}. Please choose a different time or reduce the number of guests.`,
          availableCapacity: availableSeats,
          requestedGuests: numberOfGuests,
          totalCapacity: MAX_CAPACITY
        });
      }
    }

    const booking = new Booking({
      bookingId: uuidv4(),
      customerName,
      numberOfGuests,
      bookingDate,
      bookingTime,
      location,
      cuisinePreference,
      specialRequests,
      weatherInfo,
      seatingPreference,
      status
    });

    const saved = await booking.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating booking:', err.message);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err.message);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    return res.json(booking);
  } catch (err) {
    console.error('Error fetching booking:', err.message);
    return res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.id },
      { status: 'cancelled' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    console.error('Error cancelling booking:', err.message);
    return res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

module.exports = router;


