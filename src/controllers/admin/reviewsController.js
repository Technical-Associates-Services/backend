const prisma = require('../../config/db');

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await prisma.productReview.findMany({ 
      include: { product: true },
      orderBy: { id: 'desc' } 
    });
    res.json({ result: 'success', reviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

exports.updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedReview = await prisma.productReview.update({
      where: { id: parseInt(id) },
      data: { status: parseInt(status), updated_at: new Date() }
    });

    res.json({ result: 'success', message: 'Review status updated', review: updatedReview });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review status' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.productReview.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
