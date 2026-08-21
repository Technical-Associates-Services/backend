const prisma = require('../../config/db');

exports.getAllCatalogues = async (req, res) => {
  try {
    const catalogues = await prisma.catalogue.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', catalogues });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch catalogues' });
  }
};

exports.createCatalogue = async (req, res) => {
  try {
    const { title, slug, image, file, status } = req.body;
    const user_id = req.user ? req.user.id : 1;

    const newCatalogue = await prisma.catalogue.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        image: image || null,
        file: file || '',
        user_id,
        status: status !== undefined ? parseInt(status) : 1,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Catalogue created', catalogue: newCatalogue });
  } catch (error) {
    console.error('Error creating catalogue:', error);
    res.status(500).json({ error: 'Failed to create catalogue' });
  }
};

exports.updateCatalogue = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, image, file, status } = req.body;

    const updatedCatalogue = await prisma.catalogue.update({
      where: { id: parseInt(id) },
      data: {
        title, slug, image, file,
        status: parseInt(status),
        updated_at: new Date()
      }
    });

    res.json({ result: 'success', message: 'Catalogue updated', catalogue: updatedCatalogue });
  } catch (error) {
    console.error('Error updating catalogue:', error);
    res.status(500).json({ error: 'Failed to update catalogue' });
  }
};

exports.deleteCatalogue = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.catalogue.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Catalogue deleted' });
  } catch (error) {
    console.error('Error deleting catalogue:', error);
    res.status(500).json({ error: 'Failed to delete catalogue' });
  }
};
