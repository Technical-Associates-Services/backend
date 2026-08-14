const prisma = require('../../config/db');

// --- Contacts (read-only inbox) ---
exports.getContacts = async (req, res) => {
  try {
    const contacts = await prisma.contactForm.findMany({
      orderBy: { id: 'desc' },
      take: 200
    });
    res.json({ result: 'success', contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.contactForm.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Contact deleted' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};

// --- Subscribers (read-only) ---
exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { id: 'desc' }
    });
    res.json({ result: 'success', subscribers });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
};

exports.deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.subscriber.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Subscriber deleted' });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ error: 'Failed to delete subscriber' });
  }
};
