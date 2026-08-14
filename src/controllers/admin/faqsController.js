const prisma = require('../../config/db');

exports.getAllFaqs = async (req, res) => {
  try {
    const faqs = await prisma.faq.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', faqs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
};

exports.createFaq = async (req, res) => {
  try {
    const { question, answer, type_id, name, email, phone_number, status } = req.body;
    const user_id = req.user ? req.user.id : 1;

    let tId = type_id ? parseInt(type_id) : null;
    if (!tId) {
      let defaultType = await prisma.faqType.findFirst();
      if (!defaultType) {
        defaultType = await prisma.faqType.create({
          data: { title: 'General', slug: 'general', user_id, status: 1 }
        });
      }
      tId = defaultType.id;
    }

    const newFaq = await prisma.faq.create({
      data: {
        question, answer,
        slug: 'faq-' + Date.now(),
        type_id: tId,
        name: name || null,
        email: email || null,
        phone_number: phone_number || null,
        user_id,
        status: status !== undefined ? parseInt(status) : 1,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'FAQ created', faq: newFaq });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Failed to create FAQ', detail: error.message });
  }
};

exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, type_id, name, email, phone_number, status } = req.body;

    const updatedFaq = await prisma.faq.update({
      where: { id: parseInt(id) },
      data: {
        question, answer,
        type_id: type_id ? parseInt(type_id) : undefined,
        name, email, phone_number,
        status: parseInt(status),
        updated_at: new Date()
      }
    });

    res.json({ result: 'success', message: 'FAQ updated', faq: updatedFaq });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Failed to update FAQ', detail: error.message });
  }
};

exports.deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.faq.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'FAQ deleted' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
};
