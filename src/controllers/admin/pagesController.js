const prisma = require('../../config/db');

exports.getAllPages = async (req, res) => {
  try {
    const pages = await prisma.page.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', pages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
};

exports.createPage = async (req, res) => {
  try {
    const { title, slug, summary, description, image, seo_title, seo_keyword, seo_description, status } = req.body;
    const user_id = req.user ? req.user.id : 1;

    const newPage = await prisma.page.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        summary: summary || null,
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

    res.status(201).json({ result: 'success', message: 'Page created', page: newPage });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Failed to create page', detail: error.message });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, summary, description, image, seo_title, seo_keyword, seo_description, status } = req.body;

    const updatedPage = await prisma.page.update({
      where: { id: parseInt(id) },
      data: {
        title, slug, summary, description, image,
        seo_title, seo_keyword, seo_description,
        status: parseInt(status),
        updated_at: new Date()
      }
    });

    res.json({ result: 'success', message: 'Page updated', page: updatedPage });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ error: 'Failed to update page', detail: error.message });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.page.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Page deleted' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
};
