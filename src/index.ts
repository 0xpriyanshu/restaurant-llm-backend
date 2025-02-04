// src/server/index.ts
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

import Restaurant from './models/Restaurant';
import restaurantRoutes from './routes/restaurants';
import menuRoutes from './routes/menu';
import uploadRoutes from './routes/upload';
import openAiRoutes from './routes/openai';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


// 1) CREATE a new Restaurant (POST)
app.post('/api/restaurants', async (req, res) => {
    try {
      const { name, contactNo, address, location, menuSummary, isOnline } = req.body;
  
      // Generate a new restaurantId (UUID)
      const restaurantId = uuidv4();
  
      // Transform location if needed
      let transformedLocation;
      if (location?.latitude != null && location?.longitude != null) {
        transformedLocation = {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        };
      }
  
      const newRestaurant = await Restaurant.create({
        restaurantId,
        name,
        contactNo,
        address,
        menuSummary,
        isOnline: isOnline ?? false,
        location: transformedLocation,
      });
      console.log('New restaurant created:', newRestaurant); 
  
      return res.status(201).json({
        success: true,
        message: 'Restaurant created successfully',
        data: {
            restaurantId: newRestaurant.restaurantId,  // <-- Ensure restaurantId is explicitly included
            ...newRestaurant.toObject(),
        },
      });
    } catch (error) {
      console.error('Error creating restaurant:', error);
      return res.status(500).json({
        success: false,
        error: 'Error creating restaurant',
      });
    }
  });

// 2) UPDATE an existing Restaurant by its restaurantId (PUT)
app.put('/api/restaurants/:id', async (req, res) => {
    try {
      const { id } = req.params; // This is the "restaurantId"
  
      // Transform location if present
      let transformedLocation;
      if (req.body.location?.latitude != null && req.body.location?.longitude != null) {
        transformedLocation = {
          type: 'Point',
          coordinates: [req.body.location.longitude, req.body.location.latitude],
        };
      }
  
      // Build fields to update
      const updateFields: Record<string, any> = {
        name: req.body.name,
        contactNo: req.body.contactNo,
        address: req.body.address,
        menuSummary: req.body.menuSummary,
        isOnline: req.body.isOnline ?? false,
      };
      if (transformedLocation) {
        updateFields.location = transformedLocation;
      }
  
      const updatedRestaurant = await Restaurant.findOneAndUpdate(
        { restaurantId: id },
        updateFields,
        { new: true, runValidators: true }
      );
  
      if (!updatedRestaurant) {
        return res.status(404).json({
          success: false,
          error: 'Restaurant not found',
        });
      }
  
      return res.json({
        success: true,
        message: 'Restaurant updated successfully',
        data: {
          ...updatedRestaurant.toObject(),
          restaurantId: updatedRestaurant.restaurantId,
        },
      });
    } catch (error) {
      console.error('Error updating restaurant:', error);
      return res.status(500).json({
        success: false,
        error: 'Error updating restaurant',
      });
    }
  });

// Example GET if needed
app.get('/api/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params; // restaurantId
    const restaurant = await Restaurant.findOne({ restaurantId: id });
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }
    return res.json({
      success: true,
      data: {
        ...restaurant.toObject(),
        restaurantId: restaurant.restaurantId,
      },
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ success: false, error: 'Error fetching restaurant' });
  }
});

// GET all restaurants
app.get('/api/restaurants', async (req, res) => {
    try {
      const restaurants = await Restaurant.find(); // Fetch all restaurants
  
      return res.json({
        success: true,
        data: restaurants.map((restaurant) => ({
          restaurantId: restaurant.restaurantId,
          name: restaurant.name,
          contactNo: restaurant.contactNo,
          address: restaurant.address,
          menuSummary: restaurant.menuSummary,
          isOnline: restaurant.isOnline,
          location: restaurant.location,
          createdAt: restaurant.createdAt,
          updatedAt: restaurant.updatedAt,
        })),
      });
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      res.status(500).json({ success: false, error: 'Error fetching restaurants' });
    }
  });

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('Connected to MongoDB');

    app.use('/api', restaurantRoutes);
    app.use('/api', menuRoutes);
    app.use('/api', uploadRoutes);
    app.use("/api/openai", openAiRoutes);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
