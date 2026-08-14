const prisma = require('../../config/db');

exports.createBrand = async (req, res) => {
  try {
    const { title, slug, image, status } = req.body;
    const user_id = req.user ? req.user.id : 1;
    
    const newItem = await prisma.brand.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        image: image || null,
        status: status !== undefined ? parseInt(status) : 1,
        user_id,
        created_at: new Date()
      }
    });
    res.status(201).json({ result: 'success', message: 'Brand created', brand: newItem });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Failed to create brand', detail: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, image, status } = req.body;
    const updated = await prisma.brand.update({
      where: { id: parseInt(id) },
      data: { title, slug, image, status: parseInt(status), updated_at: new Date() }
    });
    res.json({ result: 'success', message: 'Brand updated', brand: updated });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ error: 'Failed to update brand', detail: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.brand.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Brand deleted' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Failed to delete brand' });
  }
};
