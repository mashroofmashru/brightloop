import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/products (Available to all authenticated users; staff & customers can view)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { type, search } = req.query;

    let query = 'SELECT * FROM products WHERE is_active = 1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (search) {
      query += ' AND (name LIKE ? OR notes LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY id DESC';

    const products = db.prepare(query).all(...params);

    // Attach variants for each product
    const getVariants = db.prepare(`
      SELECT id, attribute_name, attribute_value, price_extra, sku
      FROM product_variants
      WHERE product_id = ?
      ORDER BY id ASC
    `);

    const productsWithVariants = products.map(prod => ({
      ...prod,
      variants: getVariants.all(prod.id)
    }));

    res.json({ products: productsWithVariants });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// GET /api/products/:id
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const variants = db.prepare(`
      SELECT id, attribute_name, attribute_value, price_extra, sku
      FROM product_variants
      WHERE product_id = ?
    `).all(product.id);

    res.json({ product: { ...product, variants } });
  } catch (error) {
    console.error('Fetch product detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve product details' });
  }
});

// POST /api/products (ADMIN ONLY: "Only the admin can add products and manage variants")
router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, type, sales_price, cost_price, notes, variants } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const validTypes = ['software', 'service', 'physical'];
    const prodType = validTypes.includes(type) ? type : 'software';
    const numSalesPrice = parseFloat(sales_price) || 0;
    const numCostPrice = parseFloat(cost_price) || 0;

    const createProductTransaction = db.transaction(() => {
      const insertProd = db.prepare(`
        INSERT INTO products (name, type, sales_price, cost_price, notes, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `);
      const prodResult = insertProd.run(name.trim(), prodType, numSalesPrice, numCostPrice, notes || null);
      const productId = prodResult.lastInsertRowid;

      const insertVariant = db.prepare(`
        INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra, sku)
        VALUES (?, ?, ?, ?, ?)
      `);

      if (Array.isArray(variants) && variants.length > 0) {
        for (const variant of variants) {
          if (variant.attribute_name && variant.attribute_value) {
            insertVariant.run(
              productId,
              variant.attribute_name.trim(),
              variant.attribute_value.trim(),
              parseFloat(variant.price_extra) || 0,
              variant.sku ? variant.sku.trim() : null
            );
          }
        }
      }

      return productId;
    });

    const newProductId = createProductTransaction();

    const createdProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(newProductId);
    const createdVariants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(newProductId);

    res.status(201).json({
      message: 'Product created successfully',
      product: { ...createdProduct, variants: createdVariants }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id (ADMIN ONLY)
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const productId = req.params.id;
    const { name, type, sales_price, cost_price, notes, variants } = req.body;

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updateProductTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE products
        SET name = ?, type = ?, sales_price = ?, cost_price = ?, notes = ?
        WHERE id = ?
      `).run(
        name.trim(),
        type || 'software',
        parseFloat(sales_price) || 0,
        parseFloat(cost_price) || 0,
        notes || null,
        productId
      );

      // Re-sync variants
      if (Array.isArray(variants)) {
        db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId);

        const insertVariant = db.prepare(`
          INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra, sku)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const variant of variants) {
          if (variant.attribute_name && variant.attribute_value) {
            insertVariant.run(
              productId,
              variant.attribute_name.trim(),
              variant.attribute_value.trim(),
              parseFloat(variant.price_extra) || 0,
              variant.sku ? variant.sku.trim() : null
            );
          }
        }
      }
    });

    updateProductTransaction();

    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    const updatedVariants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(productId);

    res.json({
      message: 'Product updated successfully',
      product: { ...updatedProduct, variants: updatedVariants }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id (ADMIN ONLY: Soft-delete/toggle status)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const productId = req.params.id;
    const product = db.prepare('SELECT id, is_active FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newStatus = product.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE products SET is_active = ? WHERE id = ?').run(newStatus, productId);

    res.json({
      message: newStatus === 0 ? 'Product archived' : 'Product activated',
      is_active: newStatus
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to toggle product status' });
  }
});

export default router;
