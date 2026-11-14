import Product from '../models/product.js';

// 1. Add New Product
export const addProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 2. Get All Products + AI Stock Prediction
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    // AI Smart Prediction Logic
    const enrichedProducts = products.map((item) => {
      const dailyRate = item.dailySalesAvg > 0 ? item.dailySalesAvg : 1;
      const daysUntilStockout = Math.floor(item.quantity / dailyRate);
      const isLowStock = item.quantity <= item.minStockLevel || daysUntilStockout <= 5;
      const recommendedRestock = isLowStock ? Math.max(dailyRate * 14 - item.quantity, 10) : 0;

      return {
        ...item._doc,
        aiInsights: {
          daysUntilStockout,
          status: item.quantity === 0 ? 'Out of Stock' : isLowStock ? 'Low Stock Alert' : 'Healthy',
          recommendedRestock,
        },
      };
    });

    res.json(enrichedProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Update Product (Stock ya Price update)
export const updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 4. Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};