const prisma = require('../../config/db');
const { deleteFromStorage } = require('../../utils/mediaService');

exports.createProduct = async (req, res) => {
  try {
    const {
      title, slug, category_id, brand_id, summary, description,
      warranty, specification, installation, price, sale_price,
      type, stock, seo_title, seo_keyword, seo_description, status, image
    } = req.body;

    const user_id = req.user ? req.user.id : 1;

    const newProduct = await prisma.product.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        category_id: parseInt(category_id),
        brand_id: brand_id ? parseInt(brand_id) : null,
        summary: summary || null,
        description: description || '',
        warranty: warranty || null,
        specification: specification || null,
        installation: installation || null,
        price: price || null,
        sale_price: sale_price || null,
        type: type || null,
        stock: stock || '0',
        seo_title: seo_title || null,
        seo_keyword: seo_keyword || null,
        seo_description: seo_description || null,
        status: status !== undefined ? parseInt(status) : 1,
        image: image || null,
        user_id,
        created_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'Product created', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, slug, category_id, brand_id, summary, description,
      warranty, specification, installation, price, sale_price,
      type, stock, seo_title, seo_keyword, seo_description, status, image, download
    } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (existing) {
      if (image !== undefined && image !== existing.image && existing.image) {
        await deleteFromStorage('products', existing.image);
      }
      if (download !== undefined && download !== existing.download && existing.download) {
        await deleteFromStorage('products', existing.download);
      }
    }

    const data = {
      title,
      slug,
      summary,
      description,
      warranty,
      specification,
      installation,
      price,
      sale_price,
      type,
      stock,
      seo_title,
      seo_keyword,
      seo_description,
      image,
      download,
      updated_at: new Date()
    };

    if (category_id !== undefined && category_id !== null && category_id !== '' && !isNaN(parseInt(category_id))) {
      data.category_id = parseInt(category_id);
    }

    if (brand_id !== undefined) {
      if (brand_id === null || brand_id === '' || brand_id === 0 || brand_id === '0') {
        data.brand_id = null;
      } else if (!isNaN(parseInt(brand_id))) {
        data.brand_id = parseInt(brand_id);
      }
    }

    if (status !== undefined && status !== null && !isNaN(parseInt(status))) {
      data.status = parseInt(status);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({ result: 'success', message: 'Product updated', product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        downloads: true
      }
    });

    if (existing) {
      if (existing.image) await deleteFromStorage('products', existing.image);
      if (existing.download) await deleteFromStorage('products', existing.download);
      if (Array.isArray(existing.images)) {
        for (const img of existing.images) {
          if (img.filename) await deleteFromStorage('products', img.filename);
        }
      }
      if (Array.isArray(existing.downloads)) {
        for (const dl of existing.downloads) {
          if (dl.filename) await deleteFromStorage('products', dl.filename);
        }
      }

      await prisma.image.deleteMany({ where: { product_id: productId } });
      await prisma.downloadFile.deleteMany({ where: { product_id: productId } });
      await prisma.productReview.deleteMany({ where: { product_id: productId } });
      await prisma.productEnquiry.deleteMany({ where: { product_id: productId } });
    }

    await prisma.product.delete({
      where: { id: productId }
    });
    res.json({ result: 'success', message: 'Product and associated media deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
