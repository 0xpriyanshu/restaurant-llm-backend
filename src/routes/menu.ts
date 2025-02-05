// routes/menu.ts
import express from 'express';
import Restaurant from '../models/Restaurant';
import RestaurantMenu from '../models/Menu';

const router = express.Router();

/**
 * GET /restaurants/:restaurantId/menu
 * Fetch the single RestaurantMenu document (including items with inline customisation).
 */
router.get('/restaurants/:restaurantId/menu', async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Ensure the restaurant exists
    const restaurant = await Restaurant.findOne({ restaurantId });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: `Restaurant not found with ID: ${restaurantId}`,
      });
    }

    // Fetch the menu for this restaurant
    const menu = await RestaurantMenu.findOne({ restaurantId });
    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found for the given restaurant.',
      });
    }

    return res.json({
      success: true,
      data: {
        restaurant,
        menu, // Contains items with their inline customisation
      },
    });
  } catch (error: any) {
    console.error('Error fetching menu:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch menu',
      details: error.message,
    });
  }
});

/**
 * PUT /restaurants/:restaurantId/menu
 * Upserts a single RestaurantMenu document with items that each have their own customisation property.
 * If a menu item does not have a customisation provided by the frontend, it will default to { categories: [] }.
 */
router.put('/restaurants/:restaurantId/menu', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    // The frontend sends an object with two properties: menuItems and customisations.
    // If customisations are omitted for an item, that's fine.
    const { menuItems = [], customisations = [] } = req.body;

    // Ensure the restaurant exists
    const restaurant = await Restaurant.findOne({ restaurantId });
    if (!restaurant) {
      throw new Error(`Restaurant not found with ID: ${restaurantId}`);
    }

    // Merge customisations into each menu item.
    // For each item, we try to find a corresponding customisation (based on the item's id)
    // If not found, we default to an empty customisation: { categories: [] }.
    const mergedItems = menuItems.map((item: any) => {
      const found = customisations.find((c: any) => c.id === item.id);
      return {
        ...item,
        id: Number(item.id), // Ensure id is a number
        price: Number(item.price || 0),
        spicinessLevel: Number(item.spicinessLevel || 0),
        sweetnessLevel: Number(item.sweetnessLevel || 0),
        healthinessScore: Number(item.healthinessScore || 0),
        sufficientFor: Number(item.sufficientFor || 1),
        available: Boolean(item.available !== false),
        dietaryPreference: Array.isArray(item.dietaryPreference)
          ? item.dietaryPreference
          : [],
        caffeineLevel: String(item.caffeineLevel || 'None'),
        image: String(item.image || ''),
        // If customisation is provided in the customisations array, use it; otherwise default to empty.
        customisation: found ? found.customisation : { categories: [] },
      };
    });

    // Build the full menu document
    const menuDoc = {
      restaurantId,
      restaurantName: restaurant.name,
      items: mergedItems,
      lastUpdated: new Date(),
    };

    // Upsert (create or update) the RestaurantMenu document
    const updatedMenu = await RestaurantMenu.findOneAndUpdate(
      { restaurantId },
      { $set: menuDoc },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      success: true,
      message: 'Menu updated successfully',
      data: updatedMenu,
    });
  } catch (error: any) {
    console.error('Error updating menu:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update menu',
      details: error.message,
    });
  }
});

export default router;