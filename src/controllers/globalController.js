const prisma = require('../config/db');
const { getImageUrl } = require('../utils/helpers');

exports.getAssociates = async (req, res) => {
  try {
    const categories = await prisma.associationCategory.findMany({
      where: { status: 1 },
      orderBy: { order: 'asc' },
      include: {
        associations: {
          where: { status: 1 },
          orderBy: { order: 'asc' }
        }
      }
    });

    const formattedCategories = categories.map(cat => ({
      ...cat,
      associations: cat.associations.map(assoc => ({
        ...assoc,
        image: getImageUrl('associations', assoc.image)
      }))
    }));

    res.json({
      result: "success",
      categories: formattedCategories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSisterConcerns = async (req, res) => {
  try {
    const concerns = await prisma.concern.findMany({
      where: { status: 1 },
      orderBy: { order: 'asc' }
    });

    const formattedConcerns = concerns.map(c => ({
      ...c,
      image: getImageUrl('concerns', c.image)
    }));

    res.json({
      result: "success",
      concerns: formattedConcerns
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { status: 1 },
      orderBy: { id: 'desc' }
    });

    const formattedTestimonials = testimonials.map(t => ({
      ...t,
      name: t.full_name,
      company: t.company_name,
      image: getImageUrl('testimonials', t.image)
    }));

    res.json({
      result: "success",
      testimonials: formattedTestimonials
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { status: 1 },
      orderBy: { id: 'desc' }
    });

    const formattedBanners = banners.map(b => ({
      ...b,
      image: getImageUrl('banners', b.image)
    }));

    res.json({
      result: "success",
      banners: formattedBanners
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getBrands = async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      where: { status: 1 },
      orderBy: { id: 'desc' }
    });

    const formattedBrands = brands.map(b => ({
      ...b,
      image: getImageUrl('brands', b.image),
      icon: getImageUrl('brands', b.image) // some models use icon
    }));

    res.json({
      result: "success",
      brands: formattedBrands
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getFaqs = async (req, res) => {
  try {
    const categories = await prisma.faqType.findMany({
      where: { status: 1 },
      include: {
        faqs: {
          where: { status: 1 },
          orderBy: { id: 'desc' }
        }
      }
    });

    res.json({
      result: "success",
      categories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { status: 1 },
      orderBy: { id: 'desc' }
    });

    const formattedServices = services.map(s => ({
      ...s,
      image: getImageUrl('services', s.image)
    }));

    res.json({
      result: "success",
      services: formattedServices
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getServiceBySlug = async (req, res) => {
  try {
    const service = await prisma.service.findFirst({
      where: { slug: req.params.service, status: 1 }
    });

    if (!service) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({
      result: "success",
      service: {
        ...service,
        image: getImageUrl('services', service.image)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPlugins = async (req, res) => {
  try {
    const plugins = await prisma.plugin.findMany({
      where: { status: 1 }
    });

    res.json({
      result: "success",
      plugins
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPages = async (req, res) => {
  try {
    const pages = await prisma.page.findMany({
      where: { status: 1 }
    });

    res.json({
      result: "success",
      pages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPageBySlug = async (req, res) => {
  try {
    const page = await prisma.page.findFirst({
      where: { slug: req.params.page, status: 1 }
    });

    if (!page) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({
      result: "success",
      page: {
        ...page,
        image: getImageUrl('pages', page.image)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSolutions = async (req, res) => {
  try {
    const solutions = await prisma.solution.findMany({
      where: { status: 1 }
    });

    const formattedSolutions = solutions.map(s => ({
      ...s,
      image: getImageUrl('solutions', s.image),
      download: s.download_pdf ? getImageUrl('solutions', s.download_pdf) : null
    }));

    res.json({
      result: "success",
      solutions: formattedSolutions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSolutionBySlug = async (req, res) => {
  try {
    const solution = await prisma.solution.findFirst({
      where: { slug: req.params.solution, status: 1 }
    });

    if (!solution) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({
      result: "success",
      solution: {
        ...solution,
        image: getImageUrl('solutions', solution.image),
        download: solution.download_pdf ? getImageUrl('solutions', solution.download_pdf) : null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
