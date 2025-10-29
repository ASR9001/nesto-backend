import mongoose from 'mongoose';


const availabilitySchema = new mongoose.Schema({
  availableAllTheTime: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, { _id: false })


const unavailabilitySchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
  },
   startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
}, { _id: false });


const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  pincode:
  {
    type: String,
    required: true
  },
}, { _id: false })


const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      // maxlength: 400,
    },
    propertyType: {
      type: String,
      required: true
    },
    location: {
      type: locationSchema,
      required: true
    }
    ,
    pricePerNight: {
      type: Number,
      required: true,
    },
    featured: {
      type: Boolean,
      default: false
    },
    images: [String],
    amenities: [{
      type: String,
      // enum: ['wifi', 'parking', 'ac', 'pool', 'kitchen'],
    }],

    guestCapacity: {
      type: Number,
      required: true
    },
    bedrooms: {
      type: Number,
      required: true
    },
    bathrooms: {
      type: Number,
      required: true
    },
    kingSizeBed: {
      type: Number,
      required: true
    },
    queenSizeBed: {
      type: Number,
      required: true
    },
    singleBed: {
      type: Number,
      required: true
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    availability: {
      type: availabilitySchema,
      required: true
    },
    unavailability: {
      type: [unavailabilitySchema],
      default: []
    },
    discount: {
      type: Number,
      default: 0
    },
    totalStars: {
      type: Number,
      default: null
    },
    rules: {
      type: [String],
      required: false
    },
    isActive:{
      type:Boolean,
      default:true
    },
    isApproved:{
      type:Boolean,
      default:true
    },
    bestFor:{
      type:String,
      required:true,
      enum:["COUPLE" , "TRAVELER" , "BOTH"]
    },
    isLocalIdAllowed:{
      type:Boolean,
      required:true,
      default:true
    },
    zeroContact:{
      type:Boolean,
      required:true,
    }


  },

  {
    timestamps: true,
  }
);

const Property = mongoose.model('Property', propertySchema);

export default Property;
