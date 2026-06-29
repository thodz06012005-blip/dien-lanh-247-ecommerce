const express = require('express');
const router = express.Router();
const { readDB } = require('../utils/db');
const { respondSuccess, respondError } = require('../utils/response');

// Adapters to map mock-db standardized model to customer frontend (frontend-user) formats
const mapProductToUser = (p) => {
  // Convert specifications format: array of {name, value} -> object Record<string, string>
  const specificationsObj = {};
  if (Array.isArray(p.specifications)) {
    p.specifications.forEach(spec => {
      specificationsObj[spec.name] = spec.value;
    });
  } else if (p.specifications && typeof p.specifications === 'object') {
    Object.assign(specificationsObj, p.specifications);
  }

  // Convert images to [{url: ...}] format
  const imagesCompat = p.images.map(img => {
    if (typeof img === 'string') {
      return { url: img };
    }
    return img;
  });

  return {
    ...p,
    price: p.salePrice || p.basePrice,
    specifications: specificationsObj,
    images: imagesCompat
  };
};

// GET /api/v1
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Điện Lạnh 247 Mock API v1 đang hoạt động ổn định!'
  });
});

// GET /health
router.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Mock API is running',
    data: {
      service: 'dl247-mock-api',
      time: new Date().toISOString()
    }
  });
});

// GET /categories
router.get('/categories', (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.categories);
});

// GET /brands
router.get('/brands', (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.brands);
});

// GET /products/featured
router.get('/products/featured', (req, res) => {
  const db = readDB();
  const featured = db.products
    .filter(p => p.isFeatured && p.status === 'active')
    .map(mapProductToUser);
  return respondSuccess(res, featured);
});

// GET /products/search
router.get('/products/search', (req, res) => {
  const db = readDB();
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) {
    return respondSuccess(res, []);
  }
  const filtered = db.products
    .filter(p => 
      p.status === 'active' && 
      (p.name.toLowerCase().includes(q) || 
       p.sku.toLowerCase().includes(q) || 
       p.description.toLowerCase().includes(q))
    )
    .map(mapProductToUser);
  return respondSuccess(res, filtered.slice(0, 10));
});

// GET /products/:identifier
router.get('/products/:identifier', (req, res) => {
  const db = readDB();
  const idOrSlug = req.params.identifier;
  const product = db.products.find(p => p.id === idOrSlug || p.slug === idOrSlug);
  
  if (product) {
    if (product.status === 'hidden') {
      return respondError(res, 404, 'Sản phẩm đã bị ẩn hoặc không tồn tại', 'PRODUCT_NOT_FOUND');
    }
    return respondSuccess(res, mapProductToUser(product));
  }
  return respondError(res, 404, 'Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND');
});

// GET /products
router.get('/products', (req, res) => {
  const db = readDB();
  let filtered = db.products.filter(p => p.status === 'active' || p.status === 'out_of_stock');

  const { categoryId, brandId, priceMin, priceMax, inverter, capacity, q, sort, inStock, hasPromo } = req.query;

  if (categoryId) {
    filtered = filtered.filter(p => p.categoryId === categoryId);
  }
  if (brandId) {
    filtered = filtered.filter(p => p.brandId === brandId);
  }
  if (priceMin) {
    filtered = filtered.filter(p => (p.salePrice || p.basePrice) >= Number(priceMin));
  }
  if (priceMax) {
    filtered = filtered.filter(p => (p.salePrice || p.basePrice) <= Number(priceMax));
  }
  if (inStock === 'true') {
    filtered = filtered.filter(p => p.stock > 0);
  } else if (inStock === 'false') {
    filtered = filtered.filter(p => p.stock <= 0);
  }
  if (hasPromo === 'true') {
    filtered = filtered.filter(p => p.salePrice && p.salePrice < p.basePrice);
  }
  if (inverter) {
    const isInv = inverter === 'true';
    filtered = filtered.filter(p => {
      const specsObj = {};
      p.specifications.forEach(s => { specsObj[s.name] = s.value; });
      const specText = specsObj['Công nghệ tiết kiệm điện'] || '';
      const hasInverter = specText.toLowerCase().includes('inverter');
      return isInv ? hasInverter : !hasInverter;
    });
  }
  if (capacity) {
    filtered = filtered.filter(p => {
      const specsObj = {};
      p.specifications.forEach(s => { specsObj[s.name] = s.value; });
      const specText = specsObj['Công suất lạnh'] || '';
      return specText.toLowerCase().includes(capacity.toLowerCase());
    });
  }
  if (q) {
    const searchWord = q.toLowerCase().trim();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchWord) || 
      p.sku.toLowerCase().includes(searchWord) || 
      p.description.toLowerCase().includes(searchWord)
    );
  }

  if (sort === 'priceAsc') {
    filtered.sort((a, b) => (a.salePrice || a.basePrice) - (b.salePrice || b.basePrice));
  } else if (sort === 'priceDesc') {
    filtered.sort((a, b) => (b.salePrice || b.basePrice) - (a.salePrice || a.basePrice));
  } else if (sort === 'bestSeller') {
    filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
  } else if (sort === 'promoHot') {
    filtered.sort((a, b) => {
      const discA = a.salePrice ? (a.basePrice - a.salePrice) : 0;
      const discB = b.salePrice ? (b.basePrice - b.salePrice) : 0;
      return discB - discA;
    });
  } else {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 12);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedData = filtered.slice((page - 1) * limit, page * limit).map(mapProductToUser);

  return respondSuccess(res, paginatedData, 'Lấy danh sách sản phẩm thành công', {
    page,
    limit,
    total,
    totalPages
  });
});

// GET /settings/public
router.get('/settings/public', (req, res) => {
  const db = readDB();
  const pub = {
    hotline: db.settings.hotline,
    zalo: db.settings.zalo,
    email: db.settings.email,
    address: db.settings.address,
    shippingFee: db.settings.shippingFee,
    freeShippingThreshold: db.settings.freeShippingThreshold
  };
  return respondSuccess(res, pub);
});

// GET /service-categories
router.get('/service-categories', (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.serviceCategories || []);
});

module.exports = router;
