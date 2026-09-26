import ProductModel from '../models/productModel.js';
import CategoryModel from '../models/categoryModel.js';

export const getProducts = async (req, res) => {
  try {
    const products = await ProductModel.findAll();
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Server error fetching product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, sku, category_id, uom, reorder_level } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }
    if (!sku || sku.trim() === '') {
      return res.status(400).json({ success: false, message: 'SKU is required' });
    }

    // Check duplicate SKU
    const existingSku = await ProductModel.findBySku(sku.trim());
    if (existingSku) {
      return res.status(400).json({ success: false, message: 'SKU already exists' });
    }

    if (category_id) {
      const category = await CategoryModel.findById(category_id);
      if (!category) {
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }
    }

    const newId = await ProductModel.create({ 
      name: name.trim(), 
      sku: sku.trim(), 
      category_id: category_id || null, 
      uom: uom || 'Unit', 
      reorder_level: reorder_level || 0 
    });
    
    const product = await ProductModel.findById(newId);
    res.status(201).json({ success: true, message: 'Product created', product });
  } catch (error) {
    console.error('Error creating product:', error);
    // Handle MySQL duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'SKU already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error creating product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category_id, uom, reorder_level } = req.body;

    const existing = await ProductModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (sku && sku.trim() !== existing.sku) {
      const existingSku = await ProductModel.findBySku(sku.trim());
      if (existingSku) {
        return res.status(400).json({ success: false, message: 'SKU already exists' });
      }
    }

    if (category_id) {
      const category = await CategoryModel.findById(category_id);
      if (!category) {
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }
    }

    const updated = await ProductModel.update(id, { 
      name: name ? name.trim() : undefined, 
      sku: sku ? sku.trim() : undefined,
      category_id: category_id !== undefined ? category_id : undefined,
      uom,
      reorder_level
    });

    if (updated) {
      const product = await ProductModel.findById(id);
      res.status(200).json({ success: true, message: 'Product updated', product });
    } else {
      res.status(400).json({ success: false, message: 'Could not update product' });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'SKU already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error updating product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await ProductModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const deleted = await ProductModel.deactivate(id);
    if (deleted) {
      res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Could not delete product' });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Server error deleting product' });
  }
};
