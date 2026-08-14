const prisma = require('../../config/db');

exports.getAllShops = async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', shops });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
};

exports.createShop = async (req, res) => {
  try {
    const { title, slug, image, website, status } = req.body;
    const user_id = req.user ? req.user.id : 1;

    const newShop = await prisma.shop.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        image: image || null,
        website: website || null,
        user_id,
        status: status !== undefined ? parseInt(status) : 1,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Shop created', shop: newShop });
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({ error: 'Failed to create shop', detail: error.message });
  }
};

exports.updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, image, website, status } = req.body;

    const updatedShop = await prisma.shop.update({
      where: { id: parseInt(id) },
      data: {
        title, slug, image, website,
        status: parseInt(status),
        updated_at: new Date()
      }
    });

    res.json({ result: 'success', message: 'Shop updated', shop: updatedShop });
  } catch (error) {
    console.error('Error updating shop:', error);
    res.status(500).json({ error: 'Failed to update shop', detail: error.message });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.shop.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Shop deleted' });
  } catch (error) {
    console.error('Error deleting shop:', error);
    res.status(500).json({ error: 'Failed to delete shop' });
  }
};
