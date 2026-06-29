const isValidPhone = (phone) => {
  const phoneRegex = /^(?:\+84|84|0)(?:3|5|7|8|9)\d{8}$/;
  return phoneRegex.test(phone);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-');
};

module.exports = {
  isValidPhone,
  isValidEmail,
  slugify
};
