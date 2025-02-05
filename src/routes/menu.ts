// routes/menu.ts
import express from 'express';
import Restaurant from '../models/Restaurant';
import RestaurantMenu from '../models/Menu';

const router = express.Router();

/**
 * GET /restaurants/:id/menu
 * Fetch the menu using numeric ID
 */
router.get('/restaurants/:id/menu', async (req, res) => {
  try {
    const { id } = req.params;
    let restaurant;

    // Check if using numeric id
    if (req.app.locals.restaurantIdMap?.has(id)) {
      const originalId = req.app.locals.restaurantIdMap.get(id);
      restaurant = await Restaurant.findOne({ restaurantId: originalId });
    } else {
      restaurant = await Restaurant.findOne({ restaurantId: id });
    }

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: `Restaurant not found with ID: ${id}`,
      });
    }

    // Fetch menu using the internal UUID
    const menu = await RestaurantMenu.findOne({ 
      restaurantId: restaurant.restaurantId 
    });

    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found for the given restaurant.',
      });
    }

    // Get numeric ID for response
    let numericId;
    if (req.app.locals.restaurantIdMap) {
      for (const [key, value] of req.app.locals.restaurantIdMap.entries()) {
        if (value === restaurant.restaurantId) {
          numericId = parseInt(key);
          break;
        }
      }
    }

    return res.json({
      success: true,
      data: {
        restaurant: {
          id: numericId,
          name: restaurant.name,
          menuSummary: restaurant.menuSummary,
          location: restaurant.location
        },
        menu: {
          ...menu.toObject(),
          restaurantId: numericId // Replace UUID with numeric ID in response
        }
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
 * PUT /restaurants/:id/menu
 * Update menu using numeric ID
 */
router.put('/restaurants/:id/menu', async (req, res) => {
  try {
    const { id } = req.params;
    const { menuItems = [], customisations = [] } = req.body;
    let restaurant;

    // Check if using numeric id
    if (req.app.locals.restaurantIdMap?.has(id)) {
      const originalId = req.app.locals.restaurantIdMap.get(id);
      restaurant = await Restaurant.findOne({ restaurantId: originalId });
    } else {
      restaurant = await Restaurant.findOne({ restaurantId: id });
    }

    if (!restaurant) {
      throw new Error(`Restaurant not found with ID: ${id}`);
    }

    // Process menu items
    const mergedItems = menuItems.map((item: any) => {
      const found = customisations.find((c: any) => c.id === item.id);
      return {
        ...item,
        id: Number(item.id),
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
        customisation: found ? found.customisation : { categories: [] },
      };
    });

    // Create menu document using internal UUID
    const menuDoc = {
      restaurantId: restaurant.restaurantId, // Use internal UUID
      restaurantName: restaurant.name,
      items: mergedItems,
      lastUpdated: new Date(),
    };

    const updatedMenu = await RestaurantMenu.findOneAndUpdate(
      { restaurantId: restaurant.restaurantId },
      { $set: menuDoc },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // Get numeric ID for response
    let numericId;
    if (req.app.locals.restaurantIdMap) {
      for (const [key, value] of req.app.locals.restaurantIdMap.entries()) {
        if (value === restaurant.restaurantId) {
          numericId = parseInt(key);
          break;
        }
      }
    }

    // Update restaurant's menuUploaded status
    await Restaurant.findOneAndUpdate(
      { restaurantId: restaurant.restaurantId },
      { menuUploaded: true }
    );

    return res.json({
      success: true,
      message: 'Menu updated successfully',
      data: {
        ...updatedMenu.toObject(),
        restaurantId: numericId, // Return numeric ID instead of UUID
        items: updatedMenu.items.map(item => ({
          ...item.toObject(),
          restaurantId: numericId // Replace UUID with numeric ID in items if needed
        }))
      },
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