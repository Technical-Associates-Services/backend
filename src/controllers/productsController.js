const prisma = require('../config/db');
const { getImageUrl } = require('../utils/helpers');

// Helper to format a single product
const formatProduct = (product) => {
  let additionals = [];
  if (product.additionals) {
    try {
      additionals = typeof product.additionals === 'string' ? JSON.parse(product.additionals) : product.additionals;
      if (Array.isArray(additionals)) {
        additionals = additionals.map(add => ({
          ...add,
          image: getImageUrl('products', add.image)
        }));
      }
    } catch (e) {
      console.error('Error parsing additionals:', e);
    }
  }

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    summary: product.summary,
    image: getImageUrl('products', product.image),
    brand_name: product.brand ? product.brand.title : null,
    brand_image: product.brand ? getImageUrl('brands', product.brand.image) : null,
    brand_link: product.brand ? product.brand.link : null,
    price: product.price,
    sale_price: product.sale_price,
    category: product.category ? product.category.title : null,
    brand: product.brand ? product.brand.title : null,
    download: product.download ? getImageUrl('products', product.download) : null,
    specification: product.specification,
    installation: product.installation,
    stock: parseInt(product.stock) || 0,
    type: product.type,
    seo_title: product.seo_title,
    seo_keyword: product.seo_keyword,
    seo_description: product.seo_description,
    additionals
  };
};

// GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { status: 1 },
      orderBy: { order: 'asc' }
    });

    // Format recursively
    const buildCategoryTree = (parentId) => {
      return categories
        .filter(c => {
          if (!parentId) {
            return !c.parent_category || c.parent_category === 'null' || c.parent_category === '' || c.parent_category === '0';
          }
          return c.parent_category === parentId;
        })
        .map(c => {
          const children = buildCategoryTree(c.id.toString());
          return {
            id: c.id,
            slug: c.slug,
            title: c.title,
            subtitle: c.subtitle,
            icon: getImageUrl('categories', c.icon),
            link: c.link,
            pdf: c.pdf ? getImageUrl('categories', c.pdf) : null,
            image: getImageUrl('categories', c.image),
            // We pass the same children to both subCategory and childCategory 
            // so the frontend MenuList can pick it up depending on the depth
            subCategory: children,
            childCategory: children
          };
        });
    };

    res.json({
      result: "success",
      categories: buildCategoryTree(null)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/category/:category
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await prisma.category.findFirst({
      where: { slug: req.params.category, status: 1 }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const products = await prisma.product.findMany({
      where: { category_id: category.id, status: 1 },
      include: { brand: true, category: true },
      orderBy: { id: 'desc' }
    });

    res.json({
      result: "success",
      category: {
        ...category,
        image: getImageUrl('categories', category.image),
        icon: getImageUrl('categories', category.icon),
        pdf: category.pdf ? getImageUrl('categories', category.pdf) : null
      },
      products: products.map(formatProduct),
      totalProducts: products.length,
      itemsCountPerPage: products.length,
      currentPage: 1,
      sort: "latest"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 1 },
      include: { brand: true, category: true },
      orderBy: { id: 'desc' }
    });

    res.json({
      result: "success",
      products: products.map(formatProduct)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/products/:category
exports.getProductsByCategory = async (req, res) => {
  try {
    const category = await prisma.category.findFirst({
      where: { slug: req.params.category, status: 1 }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const products = await prisma.product.findMany({
      where: { category_id: category.id, status: 1 },
      include: { brand: true, category: true },
      orderBy: { id: 'desc' }
    });

    res.json({
      result: "success",
      products: products.map(formatProduct)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/products/:product/show
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.product, status: 1 },
      include: { brand: true, category: true }
    });

    if (!product) {
      // Fallback: check if the slug is actually a category
      const category = await prisma.category.findFirst({
        where: { slug: req.params.product, status: 1 }
      });

      if (category) {
        // Find products belonging to this category
        const categoryProducts = await prisma.product.findMany({
          where: { category_id: category.id, status: 1 },
          include: { brand: true, category: true },
          orderBy: { id: 'desc' }
        });

        return res.json({
          result: "success",
          product: {
            id: category.id,
            title: category.title,
            description: category.description,
            image: getImageUrl('categories', category.image),
            additionals: categoryProducts.map(formatProduct) // Pass products as additionals so frontend renders them as cards!
          },
          products: [],
          shops: []
        });
      }

      return res.status(404).json({ error: "Product or Category not found" });
    }

    // Related products
    const relatedProducts = await prisma.product.findMany({
      where: { category_id: product.category_id, id: { not: product.id }, status: 1 },
      include: { brand: true, category: true },
      take: 4
    });

    res.json({
      result: "success",
      product: formatProduct(product),
      products: relatedProducts.map(formatProduct),
      shops: [] // Mocking shops for now, or you can implement logic to parse shops string
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/products/:product
exports.storeEnquiry = async (req, res) => {
  try {
    const { name, email, phone_number, remarks } = req.body;
    
    const product = await prisma.product.findFirst({
      where: { slug: req.params.product }
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    const enquiry = await prisma.productEnquiry.create({
      data: {
        slug: req.params.product + '-' + Date.now(),
        product_id: product.id,
        name,
        email,
        phone_number,
        remarks
      }
    });

    res.json({ result: "success", message: "Enquiry submitted successfully", enquiry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
