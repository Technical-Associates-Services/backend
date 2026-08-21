const prisma = require('../../config/db');

exports.getAllSolutions = async (req, res) => {
  try {
    const solutions = await prisma.solution.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', solutions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch solutions' });
  }
};

exports.createSolution = async (req, res) => {
  try {
    const { title, slug, summary, description, image, download_pdf, download_doc, sub_title, seo_title, seo_keyword, seo_description, status } = req.body;
    const user_id = req.user ? req.user.id : 1;

    const newSolution = await prisma.solution.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        summary: summary || null,
        description: description || null,
        sub_title: sub_title || null,
        image: image || null,
        download_pdf: download_pdf || null,
        download_doc: download_doc || null,
        seo_title: seo_title || null,
        seo_keyword: seo_keyword || null,
        seo_description: seo_description || null,
        user_id,
        status: status !== undefined ? parseInt(status) : 1,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Solution created', solution: newSolution });
  } catch (error) {
    console.error('Error creating solution:', error);
    res.status(500).json({ error: 'Failed to create solution' });
  }
};

exports.updateSolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, summary, description, image, download_pdf, download_doc, sub_title, seo_title, seo_keyword, seo_description, status } = req.body;

    const updatedSolution = await prisma.solution.update({
      where: { id: parseInt(id) },
      data: {
        title, slug, summary, description, image,
        download_pdf, download_doc, sub_title,
        seo_title, seo_keyword, seo_description,
        status: parseInt(status),
        updated_at: new Date()
      }
    });

    res.json({ result: 'success', message: 'Solution updated', solution: updatedSolution });
  } catch (error) {
    console.error('Error updating solution:', error);
    res.status(500).json({ error: 'Failed to update solution' });
  }
};

exports.deleteSolution = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.solution.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Solution deleted' });
  } catch (error) {
    console.error('Error deleting solution:', error);
    res.status(500).json({ error: 'Failed to delete solution' });
  }
};
