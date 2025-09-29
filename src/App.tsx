import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import AppLayout from './components/Layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Deals from './pages/Deals'
import Pipeline from './pages/Pipeline'
import Login from './pages/Login'

const { Content } = Layout

function App() {
  const isAuthenticated = localStorage.getItem('token') // Simples por enquanto

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/pipeline" element={<Pipeline />} />
      </Routes>
    </AppLayout>
  )
}

export default App