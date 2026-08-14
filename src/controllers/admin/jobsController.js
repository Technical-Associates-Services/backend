const prisma = require('../../config/db');

exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await prisma.jobList.findMany({ orderBy: { id: 'desc' } });
    res.json({ result: 'success', jobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

exports.createJob = async (req, res) => {
  try {
    const { title, slug, salary, deadline, education, experience, no_of_vacancy, type, description, summary, image, order, seo_title, seo_keyword, seo_description, status } = req.body;
    const user_id = req.user ? req.user.id : 1;

    const newJob = await prisma.jobList.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        salary: salary || 'Negotiable',
        deadline: deadline || '',
        education: education || null,
        experience: experience || null,
        no_of_vacancy: no_of_vacancy || null,
        type: type || 'Full Time',
        description: description || null,
        summary: summary || null,
        image: image || null,
        seo_title: seo_title || null,
        seo_keyword: seo_keyword || null,
        seo_description: seo_description || null,
        order: order ? parseInt(order) : 0,
        user_id,
        status: status !== undefined ? parseInt(status) : 1,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Job created', job: newJob });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job', detail: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, salary, deadline, education, experience, no_of_vacancy, type, description, summary, image, order, seo_title, seo_keyword, seo_description, status } = req.body;

    const updatedJob = await prisma.jobList.update({
      where: { id: parseInt(id) },
      data: {
        title, slug, salary, deadline, education, experience, no_of_vacancy, type, description, summary, image,
        seo_title, seo_keyword, seo_description,
        order: order !== undefined ? parseInt(order) : undefined,
        status: parseInt(status),
        updated_at: new Date()
      }
    });

    res.json({ result: 'success', message: 'Job updated', job: updatedJob });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job', detail: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.jobList.delete({ where: { id: parseInt(id) } });
    res.json({ result: 'success', message: 'Job deleted' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};
