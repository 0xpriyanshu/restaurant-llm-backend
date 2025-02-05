// models/Restaurant.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurant extends Document {
  restaurantId: string;  
  name: string;
  contactNo: string;
  address: string;
  menuSummary: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  isOnline: boolean;
  menuUploaded: boolean;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    restaurantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    contactNo: {
      type: String,
      required: true,
      match: [/^\d{10}$/, 'Please add a valid 10-digit contact number'],
    },
    address: { type: String, required: true, trim: true },
    menuSummary: { type: String, required: true, trim: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
      },
    },
    isOnline: { type: Boolean, default: false },
    menuUploaded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Restaurant || mongoose.model<IRestaurant>('Restaurant', restaurantSchema);