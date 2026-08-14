const prisma = require('../../config/db');

exports.createCategory = async (req, res) => {
  try {
    const { title, slug, subtitle, description, parent_category, seo_title, seo_keywords, seo_description, status, order } = req.body;
    
    // We expect image/icon paths to be sent in the body if they were uploaded via the upload endpoint
    const image = req.body.image || null;
    const icon = req.body.icon || null;

    // In a real app, user_id should come from the logged-in admin token
    const user_id = req.user ? req.user.id : 1; 

    const newCategory = await prisma.category.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        subtitle: subtitle || null,
        description: description || null,
        parent_category: parent_category || null,
        seo_title: seo_title || null,
        seo_keywords: seo_keywords || null,
        seo_description: seo_description || null,
        status: status !== undefined ? parseInt(status) : 1,
        order: order !== undefined ? parseInt(order) : 0,
        image,
        icon,
        user_id,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Category created', category: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, subtitle, description, parent_category, seo_title, seo_keywords, seo_description, status, order, image, icon } = req.body;

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        title,
        slug,
        subtitle,
        description,
        parent_category,
        seo_title,
        seo_keywords,
        seo_description,
        status: parseInt(status),
        order: parseInt(order),
        image,
        icon,
        updated_at: new Date()
      }
    });

    res.json({ result: 'success', message: 'Category updated', category: updatedCategory });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id: parseInt(id) }
    });
    res.json({ result: 'success', message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
