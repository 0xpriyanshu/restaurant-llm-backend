import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Restaurant from '../models/Restaurant';

const router = express.Router();

// Helper function to get numeric ID from restaurantId
const getNumericId = (restaurantId: string, idMap: Map<string, string>) => {
  for (const [key, value] of idMap.entries()) {
    if (value === restaurantId) return parseInt(key);
  }
  return null;
};

// GET all restaurants with optional online filter
router.get('/restaurants', async (req, res) => {
  try {
    const { online } = req.query;
    const query = online === 'true' ? { isOnline: true } : {};
    
    const restaurants = await Restaurant.find(query);

    // Clear and rebuild ID mapping
    req.app.locals.restaurantIdMap = new Map();
    
    const formattedData = restaurants.map((restaurant, index) => {
      const numericId = index + 1;
      req.app.locals.restaurantIdMap.set(numericId.toString(), restaurant.restaurantId);
      
      return {
        id: numericId,
        name: restaurant.name,
        menuSummary: restaurant.menuSummary,
        location: restaurant.location,
        isOnline: restaurant.isOnline
      };
    });

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ success: false, error: 'Error fetching restaurants' });
  }
});

// Create new restaurant
router.post('/restaurants', async (req, res) => {
  try {
    const restaurantId = uuidv4();
    const restaurantData = {
      ...req.body,
      restaurantId,
      menuUploaded: false
    };

    const restaurant = await Restaurant.create(restaurantData);
    
    // Generate numeric ID
    const numericId = (req.app.locals.restaurantIdMap?.size || 0) + 1;
    req.app.locals.restaurantIdMap?.set(numericId.toString(), restaurantId);

    res.status(201).json({ 
      success: true, 
      data: {
        id: numericId,
        name: restaurant.name,
        menuSummary: restaurant.menuSummary,
        location: restaurant.location,
        isOnline: restaurant.isOnline
      }
    });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ success: false, error: 'Error creating restaurant' });
  }
});

// Update restaurant
router.put('/restaurants/:id', async (req, res) => {
  try {
    const numericId = req.params.id;
    const originalId = req.app.locals.restaurantIdMap?.get(numericId);
    
    const restaurant = await Restaurant.findOneAndUpdate(
      { restaurantId: originalId || numericId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    res.json({ 
      success: true, 
      data: {
        id: parseInt(numericId),
        name: restaurant.name,
        menuSummary: restaurant.menuSummary,
        location: restaurant.location,
        isOnline: restaurant.isOnline
      }
    });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ success: false, error: 'Error updating restaurant' });
  }
});

// Get restaurant by ID
router.get('/restaurants/:id', async (req, res) => {
  try {
    const numericId = req.params.id;
    const originalId = req.app.locals.restaurantIdMap?.get(numericId);
    
    const restaurant = await Restaurant.findOne({ 
      restaurantId: originalId || numericId 
    });
    
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    res.json({ 
      success: true, 
      data: {
        id: parseInt(numericId),
        name: restaurant.name,
        menuSummary: restaurant.menuSummary,
        location: restaurant.location,
        isOnline: restaurant.isOnline,
        contactNo: restaurant.contactNo,
        address: restaurant.address,
        menuUploaded: restaurant.menuUploaded,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ success: false, error: 'Error fetching restaurant' });
  }
});

// Update menu status
router.put('/restaurants/:id/menu-status', async (req, res) => {
  try {
    const numericId = req.params.id;
    const originalId = req.app.locals.restaurantIdMap?.get(numericId);
    
    const restaurant = await Restaurant.findOneAndUpdate(
      { restaurantId: originalId || numericId },
      { menuUploaded: true },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    res.json({ 
      success: true, 
      data: {
        id: parseInt(numericId),
        name: restaurant.name,
        menuSummary: restaurant.menuSummary,
        location: restaurant.location,
        isOnline: restaurant.isOnline,
        menuUploaded: restaurant.menuUploaded
      }
    });
  } catch (error) {
    console.error('Error updating menu status:', error);
    res.status(500).json({ success: false, error: 'Error updating menu status' });
  }
});

export default router;