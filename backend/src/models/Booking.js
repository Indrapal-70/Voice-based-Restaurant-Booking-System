const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true
    },
    customerName: {
      type: String,
      required: true
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1
    },
    bookingDate: {
      type: Date,
      required: true
    },
    bookingTime: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: false
    },
    cuisinePreference: {
      type: String,
      required: false
    },
    specialRequests: {
      type: String,
      required: false
    },
    weatherInfo: {
      type: Object,
      required: false
    },
    seatingPreference: {
      type: String,
      enum: ['indoor', 'outdoor', 'unspecified'],
      default: 'unspecified'
    },
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'cancelled'],
      default: 'confirmed'
    }
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    }
  }
);

module.exports = mongoose.model('Booking', BookingSchema);


