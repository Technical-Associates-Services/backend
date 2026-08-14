const prisma = require('../../config/db');

exports.getAllPlugins = async (req, res) => {
  try {
    const plugins = await prisma.plugin.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', plugins });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plugins' });
  }
};

exports.createPlugin = async (req, res) => {
  try {
    const { title, slug, code, type, tag_type, status } = req.body;
    const user_id = req.user ? req.user.id : 1;

    const newPlugin = await prisma.plugin.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        code: code || '',
        type: type || 'custom',
        tag_type: tag_type || 'body',
        user_id,
        status: status !== undefined ? parseInt(status) : 1,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Plugin created', plugin: newPlugin });
  } catch (error) {
    console.error('Error creating plugin:', error);
    res.status(500).json({ error: 'Failed to create plugin', detail: error.message });
  }
};

exports.updatePlugin = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, code, type, tag_type, status } = req.body;

    const updatedPlugin = await prisma.plugin.update({
      where: { id: parseInt(id) },
      data: {
        title, slug, code, type, tag_type,
        status: parseInt(status),
        updated_at: new Date()
      }
    });

    res.json({ result: 'success', message: 'Plugin updated', plugin: updatedPlugin });
  } catch (error) {
    console.error('Error updating plugin:', error);
    res.status(500).json({ error: 'Failed to update plugin', detail: error.message });
  }
};

exports.deletePlugin = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.plugin.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Plugin deleted' });
  } catch (error) {
    console.error('Error deleting plugin:', error);
    res.status(500).json({ error: 'Failed to delete plugin' });
  }
};
