import axios from 'axios';
const technicianApi = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1', headers: { 'Content-Type': 'application/json' } });
technicianApi.interceptors.request.use(config => { const token = localStorage.getItem('dl247_technician_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
export default technicianApi;
