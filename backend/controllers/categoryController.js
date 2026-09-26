import CategoryModel from '../models/categoryModel.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.findAll();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Server error fetching categories' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const newId = await CategoryModel.create({ name: name.trim(), description });
    const category = await CategoryModel.findById(newId);
    
    res.status(201).json({ success: true, message: 'Category created', category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Server error creating category' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await CategoryModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name !== undefined && name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name cannot be empty' });
    }

    const updated = await CategoryModel.update(id, { 
      name: name ? name.trim() : undefined, 
      description 
    });

    if (updated) {
      const category = await CategoryModel.findById(id);
      res.status(200).json({ success: true, message: 'Category updated', category });
    } else {
      res.status(400).json({ success: false, message: 'Could not update category' });
    }
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Server error updating category' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await CategoryModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const deleted = await CategoryModel.deactivate(id);
    if (deleted) {
      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Could not delete category' });
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Server error deleting category' });
  }
};
