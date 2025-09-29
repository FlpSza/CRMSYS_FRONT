import React, { useState } from 'react'
import { Table, Button, Card, Typography, Tag, Space, Progress, Avatar } from 'antd'
import { PlusOutlined, EditOutlined, DollarOutlined } from '@ant-design/icons'
import { useQuery } from 'react-query'
import { fetchDeals } from '../services/api'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

interface Deal {
  id: string
  title: string
  value: number
  stage: string
  probability: number
  contact: {
    name: string
    company: {
      name: string
    }
  }
  createdAt: string
}

const getStageTag = (stage: string) => {
  const stages = {
    PROSPECTING: { color: 'blue', text: 'Prospecção' },
    QUALIFICATION: { color: 'orange', text: 'Qualificação' },
    PROPOSAL: { color: 'purple', text: 'Proposta' },
    NEGOTIATION: { color: 'red', text: 'Negociação' },
    CLOSED_WON: { color: 'green', text: 'Fechado' },
    CLOSED_LOST: { color: 'default', text: 'Perdido' },
  }
  
  const stageInfo = stages[stage as keyof typeof stages] || { color: 'default', text: stage }
  return <Tag color={stageInfo.color}>{stageInfo.text}</Tag>
}

const Deals: React.FC = () => {
  const { data: dealsData, isLoading } = useQuery('deals', fetchDeals)

  const columns: ColumnsType<Deal> = [
    {
      title: 'Oportunidade',
      key: 'deal',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.title}</div>
          <div style={{ color: '#666', fontSize: 12 }}>{record.contact.name}</div>
        </div>
      ),
    },
    {
      title: 'Empresa',
      dataIndex: ['contact', 'company', 'name'],
      key: 'company',
    },
    {
      title: 'Valor',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => (
        <span style={{ fontWeight: 500, color: '#52c41a' }}>
          R$ {value?.toLocaleString() || '0'}
        </span>
      ),
    },
    {
      title: 'Estágio',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => getStageTag(stage),
    },
    {
      title: 'Probabilidade',
      dataIndex: 'probability',
      key: 'probability',
      render: (probability: number) => (
        <Progress 
          percent={probability} 
          size="small" 
          status={probability > 70 ? 'success' : probability > 40 ? 'active' : 'exception'}
          style={{ minWidth: 80 }}
        />
      ),
    },
    {
      title: 'Data',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
        </Space>
      ),
    },
  ]

  const handleEdit = (deal: Deal) => {
    console.log('Editar deal:', deal)
  }

  const handleAddNew = () => {
    console.log('Adicionar novo deal')
  }

  const totalValue = dealsData?.deals?.reduce((sum: number, deal: Deal) => sum + (deal.value || 0), 0) || 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={2}>Oportunidades</Title>
          <div style={{ color: '#666', marginTop: -8 }}>
            Total: R$ {totalValue.toLocaleString()} em {dealsData?.deals?.length || 0} oportunidades
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
          Nova Oportunidade
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={dealsData?.deals || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total} oportunidades`,
        }}
      />
    </div>
  )
}

export default Deals