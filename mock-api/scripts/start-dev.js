'use strict';

if (process.env.NODE_ENV === 'production') {
  throw new Error('The mock development server must not run with NODE_ENV=production.');
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.ENABLE_DEV_ENDPOINTS = 'true';
process.env.ENABLE_DEMO_ACCOUNTS = 'true';
process.env.MOCK_ENABLE_DEMO_ACCOUNTS = 'true';

require('../server');
