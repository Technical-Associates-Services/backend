const prisma = require('../../config/db');

// --- Association Categories ---
exports.getAllAssociateCategories = async (req, res) => {
  try {
    const categories = await prisma.associationCategory.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch associate categories' });
  }
};

// --- Associates ---
exports.getAllAssociates = async (req, res) => {
  try {
    const associates = await prisma.association.findMany({ 
      include: { category: true },
      orderBy: { id: 'desc' } 
    });
    res.json({ result: 'success', associates });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch associates' });
  }
};

exports.createAssociate = async (req, res) => {
  try {
    const { title, slug, category_id, image, links, order, status } = req.body;
    const user_id = req.user ? req.user.id : 1;

    // Check if category exists, if not use a default or create one
    let catId = category_id ? parseInt(category_id) : null;
    if (!catId) {
      let defaultCat = await prisma.associationCategory.findFirst();
      if (!defaultCat) {
        defaultCat = await prisma.associationCategory.create({
          data: { title: 'General', slug: 'general', user_id, status: 1 }
        });
      }
      catId = defaultCat.id;
    }

    const newAssociate = await prisma.association.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        category_id: catId,
        image: image || null,
        links: links || null,
        order: order ? parseInt(order) : 0,
        user_id,
        status: status !== undefined ? parseInt(status) : 1,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Associate created', associate: newAssociate });
  } catch (error) {
    console.error('Error creating associate:', error);
    res.status(500).json({ error: 'Failed to create associate' });
  }
};

exports.updateAssociate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, category_id, image, links, order, status } = req.body;

    const data = {
      title, slug, image, links,
      order: order !== undefined ? parseInt(order) : undefined,
      status: parseInt(status),
      updated_at: new Date()
    };
    if (category_id) data.category_id = parseInt(category_id);

    const updatedAssociate = await prisma.association.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({ result: 'success', message: 'Associate updated', associate: updatedAssociate });
  } catch (error) {
    console.error('Error updating associate:', error);
    res.status(500).json({ error: 'Failed to update associate' });
  }
};

exports.deleteAssociate = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.association.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Associate deleted' });
  } catch (error) {
    console.error('Error deleting associate:', error);
    res.status(500).json({ error: 'Failed to delete associate' });
  }
};
