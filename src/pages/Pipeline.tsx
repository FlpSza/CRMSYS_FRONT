import React from 'react'
import { Card, Typography, Row, Col, Badge, Avatar, Progress } from 'antd'
import { DollarOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery } from 'react-query'
import { fetchDashboardData } from '../services/api'

const { Title } = Typography
const { Meta } = Card

interface PipelineStage {
  stage: string
  count: number
  totalValue: number
  deals: Array<{
    id: string
    title: string
    value: number
    contact: {
      name: string
      company: {
        name: string
      }
    }
  }>
}

const getStageInfo = (stage: string) => {
  const stages = {
    PROSPECTING: { title: 'Prospecção', color: '#1890ff' },
    QUALIFICATION: { title: 'Qualificação', color: '#fa8c16' },
    PROPOSAL: { title: 'Proposta', color: '#722ed1' },
    NEGOTIATION: { title: 'Negociação', color: '#eb2f96' },
    CLOSED_WON: { title: 'Fechado', color: '#52c41a' },
    CLOSED_LOST: { title: 'Perdido', color: '#8c8c8c' },
  }
  
  return stages[stage as keyof typeof stages] || { title: stage, color: '#d9d9d9' }
}

const Pipeline: React.FC = () => {
  const { data: dashboardData, isLoading } = useQuery('dashboard', fetchDashboardData)

  if (isLoading) {
    return <div>Carregando pipeline...</div>
  }

  const pipeline = dashboardData?.pipeline || []

  return (
    <div>
      <Title level={2}>Pipeline de Vendas</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card>
            <Title level={4}>Resumo do Pipeline</Title>
            <Row gutter={[16, 16]}>
              {pipeline.map((stage: PipelineStage) => {
                const stageInfo = getStageInfo(stage.stage)
                return (
                  <Col xs={24} sm={12} md={8} lg={4} key={stage.stage}>
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <Badge count={stage.count} style={{ backgroundColor: stageInfo.color }}>
                        <Avatar 
                          size={64} 
                          style={{ backgroundColor: stageInfo.color }}
                          icon={<DollarOutlined />}
                        />
                      </Badge>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontWeight: 500 }}>{stageInfo.title}</div>
                        <div style={{ color: '#666', fontSize: 12 }}>
                          R$ {stage.totalValue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Col>
                )
              })}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {pipeline.map((stage: PipelineStage) => {
          const stageInfo = getStageInfo(stage.stage)
          
          if (stage.stage === 'CLOSED_LOST') return null // Não mostrar fase perdida no kanban
          
          return (
            <Col xs={24} sm={12} md={8} lg={6} key={stage.stage}>
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{stageInfo.title}</span>
                    <Badge count={stage.count} style={{ backgroundColor: stageInfo.color }} />
                  </div>
                }
                headStyle={{ backgroundColor: '#fafafa' }}
                style={{ minHeight: '400px' }}
              >
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {stage.deals.map((deal) => (
                    <Card 
                      key={deal.id}
                      size="small" 
                      style={{ 
                        marginBottom: 8,
                        cursor: 'pointer',
                        background: '#f9f9f9'
                      }}
                      hoverable
                    >
                      <Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={deal.title}
                        description={
                          <div>
                            <div>{deal.contact.name}</div>
                            <div style={{ fontWeight: 500, color: '#52c41a', marginTop: 4 }}>
                              R$ {deal.value.toLocaleString()}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  ))}
                  
                  {stage.deals.length === 0 && (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#999', 
                      padding: '20px 0' 
                    }}>
                      Nenhuma oportunidade neste estágio
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>
    </div>
  )
}

export default Pipeline