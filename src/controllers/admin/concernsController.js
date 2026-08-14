const prisma = require('../../config/db');

exports.getAllConcerns = async (req, res) => {
  try {
    const concerns = await prisma.concern.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', concerns });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sister concerns' });
  }
};

exports.createConcern = async (req, res) => {
  try {
    const { title, slug, description, image, links, order, status } = req.body;
    const user_id = req.user ? req.user.id : 1;

    const newConcern = await prisma.concern.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        description: description || null,
        image: image || null,
        links: links || null,
        order: order ? parseInt(order) : 0,
        user_id,
        status: status !== undefined ? parseInt(status) : 1,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Sister Concern created', concern: newConcern });
  } catch (error) {
    console.error('Error creating concern:', error);
    res.status(500).json({ error: 'Failed to create sister concern', detail: error.message });
  }
};

exports.updateConcern = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, image, links, order, status } = req.body;

    const updatedConcern = await prisma.concern.update({
      where: { id: parseInt(id) },
      data: {
        title, slug, description, image, links,
        order: order !== undefined ? parseInt(order) : undefined,
        status: parseInt(status),
        updated_at: new Date()
      }
    });

    res.json({ result: 'success', message: 'Sister Concern updated', concern: updatedConcern });
  } catch (error) {
    console.error('Error updating concern:', error);
    res.status(500).json({ error: 'Failed to update sister concern', detail: error.message });
  }
};

exports.deleteConcern = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.concern.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Sister Concern deleted' });
  } catch (error) {
    console.error('Error deleting concern:', error);
    res.status(500).json({ error: 'Failed to delete sister concern' });
  }
};
