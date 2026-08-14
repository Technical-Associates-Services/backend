const prisma = require('../../config/db');

exports.getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await prisma.productEnquiry.findMany({ 
      include: { product: true },
      orderBy: { id: 'desc' } 
    });
    res.json({ result: 'success', enquiries });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
};

exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.productEnquiry.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Enquiry deleted' });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
};
