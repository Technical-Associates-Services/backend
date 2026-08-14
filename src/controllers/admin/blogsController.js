const prisma = require('../../config/db');

exports.createBlog = async (req, res) => {
  try {
    const { title, slug, summary, description, category_id, image, status, seo_title, seo_keyword, seo_description } = req.body;
    const user_id = req.user ? req.user.id : 1;

    // category_id is required in schema — use 1 as default if not provided
    const catId = category_id ? parseInt(category_id) : 1;
    
    const newBlog = await prisma.blog.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        summary: summary || null,
        description: description || null,
        image: image || null,
        category_id: catId,
        user_id,
        status: status !== undefined ? parseInt(status) : 1,
        seo_title: seo_title || null,
        seo_keyword: seo_keyword || null,
        seo_description: seo_description || null,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Blog created', blog: newBlog });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog', detail: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, summary, description, category_id, image, status, seo_title, seo_keyword, seo_description } = req.body;

    const data = {
      title, slug, summary, description, image,
      status: parseInt(status),
      seo_title: seo_title || null,
      seo_keyword: seo_keyword || null,
      seo_description: seo_description || null,
      updated_at: new Date()
    };
    if (category_id) data.category_id = parseInt(category_id);

    const updatedBlog = await prisma.blog.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({ result: 'success', message: 'Blog updated', blog: updatedBlog });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog', detail: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.blog.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Blog deleted' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};
