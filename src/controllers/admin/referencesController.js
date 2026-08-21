const prisma = require('../../config/db');

// --- Reference Categories ---
exports.getAllReferenceCategories = async (req, res) => {
  try {
    const categories = await prisma.referenceCategory.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reference categories' });
  }
};

// --- References ---
exports.getAllReferences = async (req, res) => {
  try {
    const references = await prisma.reference.findMany({ 
      include: { category: true },
      orderBy: { id: 'desc' } 
    });
    res.json({ result: 'success', references });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch references' });
  }
};

exports.createReference = async (req, res) => {
  try {
    const { title, slug, category_id, description, image, images, seo_title, seo_keyword, seo_description, status } = req.body;
    const user_id = req.user ? req.user.id : 1;

    let catId = category_id ? parseInt(category_id) : null;
    if (!catId) {
      let defaultCat = await prisma.referenceCategory.findFirst();
      if (!defaultCat) {
        defaultCat = await prisma.referenceCategory.create({
          data: { title: 'General', slug: 'general', user_id, status: 1 }
        });
      }
      catId = defaultCat.id;
    }

    const newReference = await prisma.reference.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        category_id: catId,
        description: description || null,
        image: image || null,
        images: images ? JSON.parse(images) : null,
        seo_title: seo_title || null,
        seo_keyword: seo_keyword || null,
        seo_description: seo_description || null,
        user_id,
        status: status !== undefined ? parseInt(status) : 1,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Reference created', reference: newReference });
  } catch (error) {
    console.error('Error creating reference:', error);
    res.status(500).json({ error: 'Failed to create reference' });
  }
};

exports.updateReference = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, category_id, description, image, images, seo_title, seo_keyword, seo_description, status } = req.body;

    const data = {
      title, slug, description, image,
      seo_title, seo_keyword, seo_description,
      status: parseInt(status),
      updated_at: new Date()
    };
    if (category_id) data.category_id = parseInt(category_id);
    if (images) data.images = JSON.parse(images);

    const updatedReference = await prisma.reference.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({ result: 'success', message: 'Reference updated', reference: updatedReference });
  } catch (error) {
    console.error('Error updating reference:', error);
    res.status(500).json({ error: 'Failed to update reference' });
  }
};

exports.deleteReference = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.reference.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Reference deleted' });
  } catch (error) {
    console.error('Error deleting reference:', error);
    res.status(500).json({ error: 'Failed to delete reference' });
  }
};
