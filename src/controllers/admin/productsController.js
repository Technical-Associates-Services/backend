const prisma = require('../../config/db');

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
      type, stock, seo_title, seo_keyword, seo_description, status, image 
    } = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        title,
        slug,
        category_id: parseInt(category_id),
        brand_id: brand_id ? parseInt(brand_id) : null,
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
        status: parseInt(status),
        image,
        updated_at: new Date()
      }
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
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });
    res.json({ result: 'success', message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
