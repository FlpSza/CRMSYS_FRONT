import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const fetchDashboardData = async () => {
  const response = await api.get('/api/reports/dashboard')
  return response.data
}

export const fetchContacts = async () => {
  const response = await api.get('/api/contacts')
  return response.data
}

export const fetchDeals = async () => {
  const response = await api.get('/api/deals')
  return response.data
}