const prisma = require('../../config/db');

exports.createBanner = async (req, res) => {
  try {
    const { title, subtitle, links, button_text, image, status } = req.body;
    const user_id = req.user ? req.user.id : 1;
    
    const newBanner = await prisma.banner.create({
      data: {
        title: title || '',
        slug: title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now() : 'banner-' + Date.now(),
        subtitle: subtitle || null,
        links: links || null,       // schema field is `links`
        image: image || null,
        status: status !== undefined ? parseInt(status) : 1,
        user_id,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Banner created', banner: newBanner });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ error: 'Failed to create banner', detail: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, links, image, status } = req.body;

    const updatedBanner = await prisma.banner.update({
      where: { id: parseInt(id) },
      data: {
        title,
        subtitle,
        links,
        image,
        status: parseInt(status),
        updated_at: new Date()
      }
    });

    res.json({ result: 'success', message: 'Banner updated', banner: updatedBanner });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ error: 'Failed to update banner', detail: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Banner deleted' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
};
