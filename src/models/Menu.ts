import mongoose, { Document, Schema } from 'mongoose';

interface AddOnItem {
  name: string;
  price: number;
}

interface AddOnCategory {
  categoryName: string;
  minQuantity: number;
  maxQuantity: number;
  items: AddOnItem[];
}

interface ItemCustomisation {
  categories: AddOnCategory[];
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  spicinessLevel: number;
  sweetnessLevel: number;
  dietaryPreference: string[];
  healthinessScore: number;
  caffeineLevel: string;
  sufficientFor: number;
  available: boolean;
  customisation: ItemCustomisation; // Add this inline property
}

interface IRestaurantMenu extends Document {
  restaurantId: string;
  restaurantName: string;
  items: MenuItem[];
  lastUpdated: Date;
}

const AddOnItemSchema = new Schema<AddOnItem>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const AddOnCategorySchema = new Schema<AddOnCategory>({
  categoryName: { type: String, required: true },
  minQuantity: { type: Number, required: true },
  maxQuantity: { type: Number, required: true },
  items: [AddOnItemSchema],
});

const ItemCustomisationSchema = new Schema<ItemCustomisation>({
  categories: [AddOnCategorySchema],
});

const MenuItemSchema = new Schema<MenuItem>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  price: { type: Number, default: 0 },
  image: { type: String, default: '' },
  spicinessLevel: { type: Number, default: 0 },
  sweetnessLevel: { type: Number, default: 0 },
  dietaryPreference: [{ type: String }],
  healthinessScore: { type: Number, default: 0 },
  caffeineLevel: { type: String, default: 'None' },
  sufficientFor: { type: Number, default: 1 },
  available: { type: Boolean, default: true },
  customisation: {
    type: ItemCustomisationSchema,
    default: { categories: [] },
  },
});

const RestaurantMenuSchema = new Schema<IRestaurantMenu>(
  {
    restaurantId: { type: String, required: true, unique: true },
    restaurantName: { type: String, required: true },
    items: [MenuItemSchema],
    lastUpdated: { type: Date, default: new Date() },
  },
  { timestamps: true }
);

const RestaurantMenu =
  mongoose.models.RestaurantMenu ||
  mongoose.model<IRestaurantMenu>('RestaurantMenu', RestaurantMenuSchema);

export default RestaurantMenu;
