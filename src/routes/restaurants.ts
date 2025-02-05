import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Restaurant from '../models/Restaurant';

const router = express.Router();

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
    res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ success: false, error: 'Error creating restaurant' });
  }
});

// Update restaurant
router.put('/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOneAndUpdate(
      { restaurantId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ success: false, error: 'Error updating restaurant' });
  }
});

// Get restaurant by ID
router.get('/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ restaurantId: req.params.id });

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ success: false, error: 'Error fetching restaurant' });
  }
});

// Update menu status (Change route to avoid conflict)
router.put('/restaurants/:id/menu-status', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOneAndUpdate(
      { restaurantId: req.params.id },
      { menuUploaded: true },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Error updating menu status:', error);
    res.status(500).json({ success: false, error: 'Error updating menu status' });
  }
});

export default router;