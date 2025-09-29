import React from 'react'
import { Row, Col, Card, Statistic, Typography } from 'antd'
import {
  UserOutlined,
  DollarOutlined,
  BarChartOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from 'react-query'
import { fetchDashboardData } from '../services/api'

const { Title } = Typography

const Dashboard: React.FC = () => {
  const { data: dashboardData, isLoading } = useQuery('dashboard', fetchDashboardData)

  if (isLoading) {
    return <div>Carregando...</div>
  }

  const salesData = [
    { month: 'Jan', sales: 65000 },
    { month: 'Fev', sales: 72000 },
    { month: 'Mar', sales: 69000 },
    { month: 'Abr', sales: 84000 },
    { month: 'Mai', sales: 76000 },
    { month: 'Jun', sales: 89500 },
  ]

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total de Leads"
              value={dashboardData?.metrics.totalLeads || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Contatos"
              value={dashboardData?.metrics.totalContacts || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Oportunidades"
              value={dashboardData?.metrics.totalDeals || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Empresas"
              value={dashboardData?.metrics.totalCompanies || 0}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Vendas dos Últimos 6 Meses">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value.toLocaleString()}`, 'Vendas']} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  dot={{ fill: '#1890ff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Atividades Recentes">
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {dashboardData?.recentActivities?.map((activity: any, index: number) => (
                <div key={index} style={{ 
                  padding: '8px 0', 
                  borderBottom: index < (dashboardData.recentActivities.length - 1) ? '1px solid #f0f0f0' : 'none' 
                }}>
                  <div style={{ fontWeight: 500 }}>{activity.title}</div>
                  <div style={{ color: '#666', fontSize: 12 }}>
                    {activity.contact?.name} • {new Date(activity.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard