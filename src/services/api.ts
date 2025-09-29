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

export const fetchCompanies = async () => {
  const response = await api.get('/api/companies')
  return response.data
}

export const createContact = async (contactData: any) => {
  const response = await api.post('/api/contacts', contactData)
  return response.data
}

export const updateContact = async (id: string, contactData: any) => {
  const response = await api.put(`/api/contacts/${id}`, contactData)
  return response.data
}

export const deleteContact = async (id: string) => {
  await api.delete(`/api/contacts/${id}`)
}

export const createDeal = async (dealData: any) => {
  const response = await api.post('/api/deals', dealData)
  return response.data
}

export const updateDeal = async (id: string, dealData: any) => {
  const response = await api.put(`/api/deals/${id}`, dealData)
  return response.data
}

export const deleteDeal = async (id: string) => {
  await api.delete(`/api/deals/${id}`)
}
