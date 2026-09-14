import axios from 'axios';
import { API_BASE_URL } from '../config/runtime';
const technicianApi = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });
technicianApi.interceptors.request.use(config => { const token = localStorage.getItem('dl247_technician_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
export default technicianApi;
