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

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const validTypes = ['software', 'service', 'physical'];
    const prodType = validTypes.includes(type) ? type : 'software';

    // Work out the variant changes before writing anything.
    // Variants are matched by attribute name + value so unchanged rows keep their ids.
    // Subscription, invoice and template lines reference variant ids, so rows in use cannot be deleted.
    let variantPlan = null;
    if (Array.isArray(variants)) {
      const current = db.prepare('SELECT id, attribute_name, attribute_value FROM product_variants WHERE product_id = ?').all(productId);
      const incoming = variants
        .filter(v => v && v.attribute_name && v.attribute_value)
        .map(v => ({
          attribute_name: String(v.attribute_name).trim(),
          attribute_value: String(v.attribute_value).trim(),
          price_extra: parseFloat(v.price_extra) || 0,
          sku: v.sku ? String(v.sku).trim() : null
        }));

      const matchedIds = new Set();
      const toUpdate = [];
      const toInsert = [];
      for (const inc of incoming) {
        const match = current.find(c =>
          !matchedIds.has(c.id) &&
          c.attribute_name === inc.attribute_name &&
          c.attribute_value === inc.attribute_value
        );
        if (match) {
          matchedIds.add(match.id);
          toUpdate.push({ id: match.id, ...inc });
        } else {
          toInsert.push(inc);
        }
      }
      const toDelete = current.filter(c => !matchedIds.has(c.id)).map(c => c.id);

      const inUse = db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM subscription_lines WHERE variant_id = ?) +
          (SELECT COUNT(*) FROM invoice_lines WHERE variant_id = ?) +
          (SELECT COUNT(*) FROM quotation_template_lines WHERE variant_id = ?) AS refs
      `);
      for (const id of toDelete) {
        if (inUse.get(id, id, id).refs > 0) {
          return res.status(409).json({
            error: 'A variant that is used by existing subscriptions or invoices cannot be removed. Keep it or archive the product instead.'
          });
        }
      }
      variantPlan = { toUpdate, toInsert, toDelete };
    }

    const updateProductTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE products
        SET name = ?, type = ?, sales_price = ?, cost_price = ?, notes = ?
        WHERE id = ?
      `).run(
        name.trim(),
        prodType,
        parseFloat(sales_price) || 0,
        parseFloat(cost_price) || 0,
        notes || null,
        productId
      );

      if (variantPlan) {
        const updateVariant = db.prepare('UPDATE product_variants SET price_extra = ?, sku = ? WHERE id = ?');
        const insertVariant = db.prepare(`
          INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra, sku)
          VALUES (?, ?, ?, ?, ?)
        `);
        const deleteVariant = db.prepare('DELETE FROM product_variants WHERE id = ?');

        for (const v of variantPlan.toUpdate) {
          updateVariant.run(v.price_extra, v.sku, v.id);
        }
        for (const v of variantPlan.toInsert) {
          insertVariant.run(productId, v.attribute_name, v.attribute_value, v.price_extra, v.sku);
        }
        for (const id of variantPlan.toDelete) {
          deleteVariant.run(id);
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
