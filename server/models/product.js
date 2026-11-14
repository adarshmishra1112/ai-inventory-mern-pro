import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    minStockLevel: { type: Number, required: true, default: 10 },
    price: { type: Number, required: true },
    dailySalesAvg: { type: Number, default: 2 }, // AI prediction ke liye avg daily sales
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);