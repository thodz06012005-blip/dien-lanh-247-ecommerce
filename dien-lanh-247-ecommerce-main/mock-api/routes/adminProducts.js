const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondCreated, respondError } = require('../utils/response');
const { slugify } = require('../utils/validators');
const { requirePermission } = require('../utils/auth');
const { auditSuccess } = require('../utils/auditLog');
const { requireDangerousConfirmation, getDangerousReason } = require('../utils/dangerousAction');
const {
  validateRequiredString,
  validateOptionalString,
  validateEnum,
  validateNumber,
  validateInteger,
  validateArrayOfStrings,
  validatePaginationStrict,
  validateSortStrict,
  validateAllowedQueryKeys,
  validateSearchQuery,
  sendValidationError
} = require('../utils/validation');

// GET /admin/products — requires: products:read (superadmin, admin, staff)
router.get('/admin/products', requirePermission('products:read'), (req, res) => {
  const errors = [];
  
  validateAllowedQueryKeys(req.query, [
    'page', 'limit', 'q', 'search', 'status', 'categoryId', 'brandId', 'sortBy', 'sortOrder'
  ], errors);
  
  validatePaginationStrict(req.query, errors);
  validateSortStrict(req.query, ['name', 'sku', 'basePrice', 'salePrice', 'stock', 'status', 'createdAt', 'updatedAt'], errors);
  
  if (req.query.q !== undefined) validateSearchQuery(req.query, 'q', errors, 100);
  if (req.query.search !== undefined) validateSearchQuery(req.query, 'search', errors, 100);
  if (req.query.status !== undefined) {
    validateEnum(req.query.status, ['active', 'inactive', 'out_of_stock'], 'status', errors, false);
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  const activeProducts = (db.products || []).filter(p => !p.deletedAt);
  return respondSuccess(res, activeProducts);
});

// POST /admin/products — requires: products:create (superadmin, admin)
router.post('/admin/products', requirePermission('products:create'), (req, res) => {
  const body = req.body;
  const errors = [];

  validateRequiredString(body.name, 'name', errors, 2, 255);
  validateRequiredString(body.sku, 'sku', errors, 2, 50);
  validateNumber(body.basePrice, 'basePrice', errors, 0, 1000000000);
  
  if (body.salePrice !== undefined && body.salePrice !== null) {
    validateNumber(body.salePrice, 'salePrice', errors, 0, 1000000000);
  }
  if (body.stock !== undefined && body.stock !== null) {
    validateInteger(body.stock, 'stock', errors, 0, 1000000);
  }
  if (body.status !== undefined && body.status !== null) {
    validateEnum(body.status, ['active', 'inactive', 'out_of_stock'], 'status', errors);
  }
  if (body.images !== undefined && body.images !== null) {
    validateArrayOfStrings(body.images, 'images', errors, 0, 10);
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();

  // Validate salePrice <= basePrice
  if (body.salePrice !== undefined && body.salePrice !== null) {
    if (Number(body.salePrice) > Number(body.basePrice)) {
      errors.push({ field: 'salePrice', message: 'Giá khuyến mãi không được lớn hơn giá gốc' });
      return sendValidationError(res, errors);
    }
  }

  const skuNormalized = body.sku.trim().toUpperCase();
  const isSkuDuplicate = db.products.some(p => p.sku === skuNormalized);
  if (isSkuDuplicate) {
    errors.push({ field: 'sku', message: 'Mã SKU đã tồn tại' });
    return sendValidationError(res, errors);
  }

  // Validate categoryId & brandId
  if (body.categoryId) {
    const catExists = (db.categories || []).some(c => c.id === body.categoryId);
    if (!catExists) {
      errors.push({ field: 'categoryId', message: 'Danh mục sản phẩm không tồn tại' });
      return sendValidationError(res, errors);
    }
  }
  if (body.brandId) {
    const brandExists = (db.brands || []).some(b => b.id === body.brandId);
    if (!brandExists) {
      errors.push({ field: 'brandId', message: 'Thương hiệu sản phẩm không tồn tại' });
      return sendValidationError(res, errors);
    }
  }

  // Validate & generate slug
  const generatedSlug = slugify(body.slug || body.name);
  if (!generatedSlug) {
    errors.push({ field: 'slug', message: 'Không thể tạo slug từ tên sản phẩm' });
    return sendValidationError(res, errors);
  }

  const isSlugDuplicate = db.products.some(p => p.slug === generatedSlug);
  if (isSlugDuplicate) {
    errors.push({ field: 'slug', message: 'Slug sản phẩm đã tồn tại' });
    return sendValidationError(res, errors);
  }

  const generatedId = body.id || `prod-${Date.now()}`;

  const newProduct = {
    id: generatedId,
    name: body.name.trim(),
    slug: generatedSlug,
    sku: skuNormalized,
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
  auditSuccess(req, 'PRODUCT_CREATED', 'product', newProduct.id, { name: newProduct.name, sku: newProduct.sku }, 'Product created successfully');

  return respondCreated(res, newProduct, 'Thêm sản phẩm mới thành công');
});

// PATCH /admin/products/:id — requires: products:update (superadmin, admin)
router.patch('/admin/products/:id', requirePermission('products:update'), (req, res) => {
  const paramErrors = [];
  validateRequiredString(req.params.id, 'id', paramErrors, 1, 50);
  if (paramErrors.length > 0) {
    return sendValidationError(res, paramErrors);
  }

  const db = readDB();
  const id = req.params.id;
  const pIndex = db.products.findIndex(p => p.id === id);

  if (pIndex === -1) {
    return respondError(res, 404, 'Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND');
  }

  const existing = db.products[pIndex];
  const body = req.body;
  const errors = [];

  if (body.name !== undefined) validateRequiredString(body.name, 'name', errors, 2, 255);
  if (body.sku !== undefined) validateRequiredString(body.sku, 'sku', errors, 2, 50);
  if (body.basePrice !== undefined) validateNumber(body.basePrice, 'basePrice', errors, 0, 1000000000);
  if (body.salePrice !== undefined && body.salePrice !== null) {
    validateNumber(body.salePrice, 'salePrice', errors, 0, 1000000000);
  }
  if (body.stock !== undefined) validateInteger(body.stock, 'stock', errors, 0, 1000000);
  if (body.status !== undefined) validateEnum(body.status, ['active', 'inactive', 'out_of_stock'], 'status', errors);
  if (body.images !== undefined) validateArrayOfStrings(body.images, 'images', errors, 0, 10);

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  // Validate salePrice <= basePrice
  if (body.salePrice !== undefined && body.salePrice !== null) {
    const compareBasePrice = body.basePrice !== undefined ? Number(body.basePrice) : Number(existing.basePrice);
    if (Number(body.salePrice) > compareBasePrice) {
      errors.push({ field: 'salePrice', message: 'Giá khuyến mãi không được lớn hơn giá gốc' });
      return sendValidationError(res, errors);
    }
  }

  // Validate SKU duplicates
  if (body.sku !== undefined) {
    const skuNormalized = body.sku.trim().toUpperCase();
    const isSkuDuplicate = db.products.some(p => p.id !== id && p.sku === skuNormalized);
    if (isSkuDuplicate) {
      errors.push({ field: 'sku', message: 'Mã SKU đã tồn tại' });
      return sendValidationError(res, errors);
    }
  }

  // Validate categoryId & brandId
  if (body.categoryId !== undefined) {
    const catExists = (db.categories || []).some(c => c.id === body.categoryId);
    if (!catExists) {
      errors.push({ field: 'categoryId', message: 'Danh mục sản phẩm không tồn tại' });
      return sendValidationError(res, errors);
    }
  }
  if (body.brandId !== undefined) {
    const brandExists = (db.brands || []).some(b => b.id === body.brandId);
    if (!brandExists) {
      errors.push({ field: 'brandId', message: 'Thương hiệu sản phẩm không tồn tại' });
      return sendValidationError(res, errors);
    }
  }

  // Validate & generate slug
  let updatedSlug = existing.slug;
  if (body.slug !== undefined || body.name !== undefined) {
    const slugInput = body.slug !== undefined ? body.slug : body.name;
    const generatedSlug = slugify(slugInput);
    if (!generatedSlug) {
      errors.push({ field: 'slug', message: 'Không thể tạo slug từ tên sản phẩm' });
      return sendValidationError(res, errors);
    }
    const isSlugDuplicate = db.products.some(p => p.id !== id && p.slug === generatedSlug);
    if (isSlugDuplicate) {
      errors.push({ field: 'slug', message: 'Slug sản phẩm đã tồn tại' });
      return sendValidationError(res, errors);
    }
    updatedSlug = generatedSlug;
  }

  const updatedProduct = {
    ...existing,
    name: body.name !== undefined ? body.name.trim() : existing.name,
    slug: updatedSlug,
    sku: body.sku !== undefined ? body.sku.trim().toUpperCase() : existing.sku,
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
  auditSuccess(req, 'PRODUCT_UPDATED', 'product', updatedProduct.id, { name: updatedProduct.name, sku: updatedProduct.sku }, 'Product updated successfully');

  return respondSuccess(res, updatedProduct, 'Cập nhật sản phẩm thành công');
});

// DELETE /admin/products/:id — requires: products:delete (superadmin ONLY)
router.delete('/admin/products/:id', requirePermission('products:delete'), (req, res) => {
  const errors = [];
  validateRequiredString(req.params.id, 'id', errors, 1, 50);
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  const id = req.params.id;
  const pIndex = db.products.findIndex(p => p.id === id);

  if (pIndex === -1) {
    return respondError(res, 404, 'Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND');
  }

  const product = db.products[pIndex];
  if (product.deletedAt) {
    return respondError(res, 400, 'Sản phẩm đã được xóa mềm trước đó', 'PRODUCT_ALREADY_DELETED');
  }

  // Dangerous confirmation check
  if (!requireDangerousConfirmation(req, res, 'DELETE_PRODUCT', 'product', id)) {
    return; // Response handled by helper
  }

  const reason = getDangerousReason(req);

  // Perform soft delete
  product.deletedAt = new Date().toISOString();
  product.deletedBy = req.admin ? req.admin.id : 'unknown';
  product.deleteReason = reason;
  product.status = 'inactive';

  writeDB(db);
  auditSuccess(req, 'PRODUCT_SOFT_DELETED', 'product', id, { id, reason }, 'Product soft deleted successfully');

  return respondSuccess(res, {}, 'Xóa sản phẩm thành công');
});

module.exports = router;
