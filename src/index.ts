// server/index.ts
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

import Restaurant from './models/Restaurant';
import menuRoutes from './routes/menu';
import uploadRoutes from './routes/upload';
import openAiRoutes from './routes/openai';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Store ID mappings
app.locals.restaurantIdMap = new Map();

// Create new restaurant
app.post('/api/restaurants', async (req, res) => {
  try {
    const { name, contactNo, address, location, menuSummary, isOnline } = req.body;
    const restaurantId = uuidv4();

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

    return res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: {
        id: app.locals.restaurantIdMap.size + 1,
        name: newRestaurant.name,
        menuSummary: newRestaurant.menuSummary,
        location: newRestaurant.location
      },
    });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    return res.status(500).json({
      success: false,
      error: 'Error creating restaurant'
    });
  }
});

// GET all restaurants with optional online filter
app.get('/api/restaurants', async (req, res) => {
  try {
    const { online } = req.query;
    const query = online === 'true' ? { isOnline: true } : {};
    
    const restaurants = await Restaurant.find(query);

    // Clear and rebuild ID mapping
    app.locals.restaurantIdMap.clear();
    
    const formattedData = restaurants.map((restaurant, index) => {
      const numericId = index + 1;
      app.locals.restaurantIdMap.set(numericId.toString(), restaurant.restaurantId);
      
      return {
        id: numericId,
        name: restaurant.name,
        menuSummary: restaurant.menuSummary,
        location: restaurant.location,
        isOnline: restaurant.isOnline
      };
    });

    return res.json({
      success: true,
      data: online === 'true' ? formattedData.filter(r => r.isOnline) : formattedData
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching restaurants'
    });
  }
});

// Get restaurant by ID
app.get('/api/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let restaurant;

    if (app.locals.restaurantIdMap.has(id)) {
      const originalId = app.locals.restaurantIdMap.get(id);
      restaurant = await Restaurant.findOne({ restaurantId: originalId });
    } else {
      restaurant = await Restaurant.findOne({ restaurantId: id });
    }

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    // Find numeric ID
    let numericId;
    for (const [key, value] of app.locals.restaurantIdMap.entries()) {
      if (value === restaurant.restaurantId) {
        numericId = parseInt(key);
        break;
      }
    }

    return res.json({
      success: true,
      data: {
        id: numericId,
        name: restaurant.name,
        contactNo: restaurant.contactNo,
        address: restaurant.address,
        menuSummary: restaurant.menuSummary,
        isOnline: restaurant.isOnline,
        location: restaurant.location,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching restaurant'
    });
  }
});

// Update restaurant
app.put('/api/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let originalId = app.locals.restaurantIdMap.get(id) || id;

    let transformedLocation;
    if (req.body.location?.latitude != null && req.body.location?.longitude != null) {
      transformedLocation = {
        type: 'Point',
        coordinates: [req.body.location.longitude, req.body.location.latitude],
      };
    }

    const updateFields: any = {
      name: req.body.name,
      contactNo: req.body.contactNo,
      address: req.body.address,
      menuSummary: req.body.menuSummary,
      isOnline: req.body.isOnline ?? false,
    };

    if (transformedLocation) {
      updateFields.location = transformedLocation;
    }

    const restaurant = await Restaurant.findOneAndUpdate(
      { restaurantId: originalId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    return res.json({
      success: true,
      data: {
        id: parseInt(id),
        name: restaurant.name,
        menuSummary: restaurant.menuSummary,
        location: restaurant.location,
        isOnline: restaurant.isOnline
      }
    });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return res.status(500).json({
      success: false,
      error: 'Error updating restaurant'
    });
  }
});

// Mount other routes
app.use('/api', menuRoutes);
app.use('/api', uploadRoutes);
app.use("/api/openai", openAiRoutes);

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });