import mongoose from 'mongoose';

const BaseRatesSchema = new mongoose.Schema({

  gst: {
    type: Number,
    default : 18
  },
  serviceFee: {
    type: Number,
    default : 10
  },
  cleaningFee: {
    type: Number,
    default : 10
  },

}, {
  timestamps: true
});

const BaseRates = mongoose.model('BaseRates', BaseRatesSchema);

export default BaseRates;



