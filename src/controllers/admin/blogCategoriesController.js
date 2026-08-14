const prisma = require('../../config/db');

exports.getAllBlogCategories = async (req, res) => {
  try {
    const categories = await prisma.blogCategory.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog categories' });
  }
};

exports.createBlogCategory = async (req, res) => {
  try {
    const { title, slug, description, image, seo_title, seo_keyword, seo_description, status } = req.body;
    const user_id = req.user ? req.user.id : 1;

    const newCat = await prisma.blogCategory.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        description: description || null,
        image: image || null,
        seo_title: seo_title || null,
        seo_keyword: seo_keyword || null,
        seo_description: seo_description || null,
        user_id,
        status: status !== undefined ? parseInt(status) : 1,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Blog category created', category: newCat });
  } catch (error) {
    console.error('Error creating blog category:', error);
    res.status(500).json({ error: 'Failed to create blog category', detail: error.message });
  }
};

exports.updateBlogCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, image, seo_title, seo_keyword, seo_description, status } = req.body;

    const updatedCat = await prisma.blogCategory.update({
      where: { id: parseInt(id) },
      data: {
        title, slug, description, image,
        seo_title, seo_keyword, seo_description,
        status: parseInt(status),
        updated_at: new Date()
      }
    });

    res.json({ result: 'success', message: 'Blog category updated', category: updatedCat });
  } catch (error) {
    console.error('Error updating blog category:', error);
    res.status(500).json({ error: 'Failed to update blog category', detail: error.message });
  }
};

exports.deleteBlogCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.blogCategory.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Blog category deleted' });
  } catch (error) {
    console.error('Error deleting blog category:', error);
    res.status(500).json({ error: 'Failed to delete blog category (make sure no blogs belong to it)' });
  }
};
