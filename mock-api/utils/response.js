const respondSuccess = (res, data = {}, message = 'Thành công', pagination = null) => {
  const payload = {
    success: true,
    message,
    data,
  };
  if (pagination) {
    payload.pagination = pagination;
  }
  return res.status(200).json(payload);
};

const respondCreated = (res, data = {}, message = 'Tạo thành công') => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

const respondError = (res, status, message, errorCode = 'ERROR') => {
  return res.status(status).json({
    success: false,
    message,
    error: errorCode,
  });
};

module.exports = {
  respondSuccess,
  respondCreated,
  respondError
};
