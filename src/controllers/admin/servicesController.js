const prisma = require('../../config/db');

exports.getAllServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', services });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

exports.createService = async (req, res) => {
  try {
    const { title, slug, summary, description, image, seo_title, seo_keyword, seo_description, status } = req.body;
    const user_id = req.user ? req.user.id : 1;

    const newService = await prisma.service.create({
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

    res.status(201).json({ result: 'success', message: 'Service created', service: newService });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service', detail: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, summary, description, image, seo_title, seo_keyword, seo_description, status } = req.body;

    const updatedService = await prisma.service.update({
      where: { id: parseInt(id) },
      data: {
        title, slug, summary, description, image,
        seo_title, seo_keyword, seo_description,
        status: parseInt(status),
        updated_at: new Date()
      }
    });

    res.json({ result: 'success', message: 'Service updated', service: updatedService });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service', detail: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Service deleted' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
};
