const prisma = require('../config/db');
const { getImageUrl } = require('../utils/helpers');

// Helper for formatting blog
const formatBlog = (blog) => ({
  id: blog.id,
  slug: blog.slug,
  title: blog.title,
  category_name: blog.category ? blog.category.title : null,
  summary: blog.summary,
  description: blog.description,
  image: getImageUrl('blogs', blog.image),
  date: blog.created_at,
  seo_title: blog.seo_title,
  seo_keyword: blog.seo_keyword,
  seo_description: blog.seo_description
});

exports.getBlogs = async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { status: 1 },
      include: { category: true },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      result: "success",
      blogs: blogs.map(formatBlog)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await prisma.blog.findFirst({
      where: { slug: req.params.blog, status: 1 },
      include: { category: true }
    });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    const recentBlogs = await prisma.blog.findMany({
      where: { status: 1, id: { not: blog.id } },
      include: { category: true },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    res.json({
      result: "success",
      blog: formatBlog(blog),
      recentBlogs: recentBlogs.map(formatBlog)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getBlogsByCategory = async (req, res) => {
  try {
    const category = await prisma.blogCategory.findFirst({
      where: { slug: req.params.blog_category, status: 1 }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const blogs = await prisma.blog.findMany({
      where: { category_id: category.id, status: 1 },
      include: { category: true },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      result: "success",
      category,
      blogs: blogs.map(formatBlog)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
