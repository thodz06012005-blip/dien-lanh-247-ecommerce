const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondCreated, respondError } = require('../utils/response');
const { slugify } = require('../utils/validators');
const { requirePermission } = require('../utils/auth');

// GET /admin/products — requires: products:read (superadmin, admin, staff)
router.get('/admin/products', requirePermission('products:read'), (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.products);
});

// POST /admin/products — requires: products:create (superadmin, admin)
router.post('/admin/products', requirePermission('products:create'), (req, res) => {
  const db = readDB();
  const body = req.body;

  // 1. Validate name
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return respondError(res, 400, 'Tên sản phẩm không được rỗng', 'INVALID_PRODUCT_DATA');
  }

  // 2. Validate SKU
  if (!body.sku || typeof body.sku !== 'string' || body.sku.trim() === '') {
    return respondError(res, 400, 'Mã SKU không được rỗng', 'INVALID_PRODUCT_DATA');
  }

  const skuNormalized = body.sku.trim().toUpperCase();
  const isSkuDuplicate = db.products.some(p => p.sku === skuNormalized);
  if (isSkuDuplicate) {
    return respondError(res, 400, 'Mã SKU đã tồn tại', 'DUPLICATE_SKU');
  }

  // 3. Validate basePrice
  if (body.basePrice === undefined || body.basePrice === null || isNaN(Number(body.basePrice)) || Number(body.basePrice) <= 0) {
    return respondError(res, 400, 'Giá bán gốc phải là số dương', 'INVALID_PRODUCT_DATA');
  }

  // 4. Validate salePrice
  if (body.salePrice !== undefined && body.salePrice !== null) {
    if (isNaN(Number(body.salePrice)) || Number(body.salePrice) < 0) {
      return respondError(res, 400, 'Giá khuyến mãi không hợp lệ', 'INVALID_PRODUCT_DATA');
    }
    if (Number(body.salePrice) > Number(body.basePrice)) {
      return respondError(res, 400, 'Giá khuyến mãi không được lớn hơn giá gốc', 'INVALID_PRODUCT_DATA');
    }
  }

  // 5. Validate stock
  if (body.stock !== undefined && body.stock !== null) {
    if (isNaN(Number(body.stock)) || Number(body.stock) < 0 || !Number.isInteger(Number(body.stock))) {
      return respondError(res, 400, 'Số lượng tồn kho phải là số nguyên không âm', 'INVALID_PRODUCT_DATA');
    }
  }

  // 6. Validate categoryId & brandId
  if (body.categoryId) {
    const catExists = (db.categories || []).some(c => c.id === body.categoryId);
    if (!catExists) {
      return respondError(res, 400, 'Danh mục sản phẩm không tồn tại', 'INVALID_CATEGORY');
    }
  }
  if (body.brandId) {
    const brandExists = (db.brands || []).some(b => b.id === body.brandId);
    if (!brandExists) {
      return respondError(res, 400, 'Thương hiệu sản phẩm không tồn tại', 'INVALID_BRAND');
    }
  }

  // 7. Validate & generate slug
  const generatedSlug = slugify(body.slug || body.name);
  if (!generatedSlug) {
    return respondError(res, 400, 'Không thể tạo slug từ tên sản phẩm', 'INVALID_SLUG');
  }

  const isSlugDuplicate = db.products.some(p => p.slug === generatedSlug);
  if (isSlugDuplicate) {
    return respondError(res, 400, 'Slug sản phẩm đã tồn tại', 'DUPLICATE_SLUG');
  }

  const generatedId = body.id || `prod-${Date.now()}`;

  const newProduct = {
    id: generatedId,
    name: body.name,
    slug: generatedSlug,
    sku: body.sku,
    categoryId: body.categoryId || 'linh-kien',
    brandId: body.brandId || 'funiki',
    thumbnail: body.thumbnail || 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=400',
    images: body.images || [body.thumbnail || 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=400'],
    basePrice: Number(body.basePrice),
    salePrice: body.salePrice ? Number(body.salePrice) : Number(body.basePrice),
    stock: Number(body.stock !== undefined ? body.stock : 10),
    lowStockThreshold: Number(body.lowStockThreshold || 3),
    status: body.status || (Number(body.stock) > 0 ? 'active' : 'out_of_stock'),
    isFeatured: !!body.isFeatured,
    isBestSeller: !!body.isBestSeller,
    isNewArrival: !!body.isNewArrival,
    specifications: body.specifications || [],
    features: body.features || [],
    description: body.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  writeDB(db);

  return respondCreated(res, newProduct, 'Thêm sản phẩm mới thành công');
});

// PATCH /admin/products/:id — requires: products:update (superadmin, admin)
router.patch('/admin/products/:id', requirePermission('products:update'), (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const pIndex = db.products.findIndex(p => p.id === id);

  if (pIndex === -1) {
    return respondError(res, 404, 'Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND');
  }

  const existing = db.products[pIndex];
  const body = req.body;

  // 1. Validate name if provided
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      return respondError(res, 400, 'Tên sản phẩm không được rỗng', 'INVALID_PRODUCT_DATA');
    }
  }

  // 2. Validate SKU if provided
  if (body.sku !== undefined) {
    if (typeof body.sku !== 'string' || body.sku.trim() === '') {
      return respondError(res, 400, 'Mã SKU không được rỗng', 'INVALID_PRODUCT_DATA');
    }
    const skuNormalized = body.sku.trim().toUpperCase();
    const isSkuDuplicate = db.products.some(p => p.id !== id && p.sku === skuNormalized);
    if (isSkuDuplicate) {
      return respondError(res, 400, 'Mã SKU đã tồn tại', 'DUPLICATE_SKU');
    }
  }

  // 3. Validate basePrice if provided
  if (body.basePrice !== undefined) {
    if (isNaN(Number(body.basePrice)) || Number(body.basePrice) <= 0) {
      return respondError(res, 400, 'Giá bán gốc phải là số dương', 'INVALID_PRODUCT_DATA');
    }
  }

  // 4. Validate salePrice if provided
  if (body.salePrice !== undefined && body.salePrice !== null) {
    if (isNaN(Number(body.salePrice)) || Number(body.salePrice) < 0) {
      return respondError(res, 400, 'Giá khuyến mãi không hợp lệ', 'INVALID_PRODUCT_DATA');
    }
    const compareBasePrice = body.basePrice !== undefined ? Number(body.basePrice) : Number(existing.basePrice);
    if (Number(body.salePrice) > compareBasePrice) {
      return respondError(res, 400, 'Giá khuyến mãi không được lớn hơn giá gốc', 'INVALID_PRODUCT_DATA');
    }
  }

  // 5. Validate stock if provided
  if (body.stock !== undefined) {
    if (isNaN(Number(body.stock)) || Number(body.stock) < 0 || !Number.isInteger(Number(body.stock))) {
      return respondError(res, 400, 'Số lượng tồn kho phải là số nguyên không âm', 'INVALID_PRODUCT_DATA');
    }
  }

  // 6. Validate categoryId & brandId if provided
  if (body.categoryId !== undefined) {
    const catExists = (db.categories || []).some(c => c.id === body.categoryId);
    if (!catExists) {
      return respondError(res, 400, 'Danh mục sản phẩm không tồn tại', 'INVALID_CATEGORY');
    }
  }
  if (body.brandId !== undefined) {
    const brandExists = (db.brands || []).some(b => b.id === body.brandId);
    if (!brandExists) {
      return respondError(res, 400, 'Thương hiệu sản phẩm không tồn tại', 'INVALID_BRAND');
    }
  }

  // 7. Validate & generate slug if name or slug changes
  let updatedSlug = existing.slug;
  if (body.slug !== undefined || body.name !== undefined) {
    const slugInput = body.slug !== undefined ? body.slug : body.name;
    const generatedSlug = slugify(slugInput);
    if (!generatedSlug) {
      return respondError(res, 400, 'Không thể tạo slug từ tên sản phẩm', 'INVALID_SLUG');
    }
    const isSlugDuplicate = db.products.some(p => p.id !== id && p.slug === generatedSlug);
    if (isSlugDuplicate) {
      return respondError(res, 400, 'Slug sản phẩm đã tồn tại', 'DUPLICATE_SLUG');
    }
    updatedSlug = generatedSlug;
  }

  const updatedProduct = {
    ...existing,
    name: body.name !== undefined ? body.name : existing.name,
    slug: updatedSlug,
    sku: body.sku !== undefined ? body.sku : existing.sku,
    categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
    brandId: body.brandId !== undefined ? body.brandId : existing.brandId,
    thumbnail: body.thumbnail !== undefined ? body.thumbnail : existing.thumbnail,
    images: body.images !== undefined ? body.images : existing.images,
    basePrice: body.basePrice !== undefined ? Number(body.basePrice) : existing.basePrice,
    salePrice: body.salePrice !== undefined ? (body.salePrice === null ? Number(body.basePrice) : Number(body.salePrice)) : existing.salePrice,
    stock: body.stock !== undefined ? Number(body.stock) : existing.stock,
    lowStockThreshold: body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : existing.lowStockThreshold,
    status: body.status !== undefined ? body.status : existing.status,
    isFeatured: body.isFeatured !== undefined ? !!body.isFeatured : existing.isFeatured,
    isBestSeller: body.isBestSeller !== undefined ? !!body.isBestSeller : existing.isBestSeller,
    isNewArrival: body.isNewArrival !== undefined ? !!body.isNewArrival : existing.isNewArrival,
    specifications: body.specifications !== undefined ? body.specifications : existing.specifications,
    features: body.features !== undefined ? body.features : existing.features,
    description: body.description !== undefined ? body.description : existing.description,
    updatedAt: new Date().toISOString()
  };

  db.products[pIndex] = updatedProduct;
  writeDB(db);

  return respondSuccess(res, updatedProduct, 'Cập nhật sản phẩm thành công');
});

// DELETE /admin/products/:id — requires: products:delete (superadmin ONLY)
router.delete('/admin/products/:id', requirePermission('products:delete'), (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const pIndex = db.products.findIndex(p => p.id === id);

  if (pIndex === -1) {
    return respondError(res, 404, 'Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND');
  }

  db.products.splice(pIndex, 1);
  writeDB(db);

  return respondSuccess(res, {}, 'Xóa sản phẩm thành công');
});

module.exports = router;
