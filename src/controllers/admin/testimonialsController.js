const prisma = require('../../config/db');

exports.createTestimonial = async (req, res) => {
  try {
    const { name, designation, company, message, image, status } = req.body;
    const user_id = req.user ? req.user.id : 1;
    
    const newItem = await prisma.testimonial.create({
      data: {
        full_name: name || '',
        position: designation || null,      // schema: position not designation
        company_name: company || null,
        message: message || '',
        image: image || null,
        status: status !== undefined ? parseInt(status) : 1,
        user_id,
        slug: (name || 'testimonial').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
        created_at: new Date()
      }
    });
    res.status(201).json({ result: 'success', message: 'Testimonial created', testimonial: newItem });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({ error: 'Failed to create testimonial', detail: error.message });
  }
};

exports.updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, designation, company, message, image, status } = req.body;
    const updated = await prisma.testimonial.update({
      where: { id: parseInt(id) },
      data: {
        full_name: name,
        position: designation,
        company_name: company,
        message,
        image,
        status: parseInt(status),
        updated_at: new Date()
      }
    });
    res.json({ result: 'success', message: 'Testimonial updated', testimonial: updated });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({ error: 'Failed to update testimonial', detail: error.message });
  }
};

exports.deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.testimonial.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Testimonial deleted' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
};
