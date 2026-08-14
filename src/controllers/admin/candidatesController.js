const prisma = require('../../config/db');

exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', candidates });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.candidate.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Candidate deleted' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
};
