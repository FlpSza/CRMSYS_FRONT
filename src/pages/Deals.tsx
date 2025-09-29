import React, { useState } from 'react'
import {
  Table,
  Button,
  Card,
  Typography,
  Tag,
  Space,
  Progress,
  Avatar,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Popconfirm,
  message
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  fetchDeals, 
  fetchContacts, 
  createDeal, 
  updateDeal, 
  deleteDeal 
} from '../services/api'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

interface Deal {
  id: string
  title: string
  value: number
  stage: string
  probability: number
  contactId: string
  userId?: string
  notes?: string
  expectedCloseDate?: string
  contact: {
    id: string
    name: string
    company: {
      name: string
    }
  }
  user?: {
    name: string
  }
  createdAt: string
}

interface Contact {
  id: string
  name: string
  company: {
    name: string
  }
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
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: dealsData, isLoading } = useQuery('deals', fetchDeals)
  const { data: contactsData } = useQuery('contacts', fetchContacts)

  const createDealMutation = useMutation(createDeal, {
    onSuccess: () => {
      message.success('Oportunidade criada com sucesso!')
      queryClient.invalidateQueries('deals')
      setIsCreateModalVisible(false)
      createForm.resetFields()
    },
    onError: () => {
      message.error('Erro ao criar oportunidade')
    }
  })

  const updateDealMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => updateDeal(id, data),
    {
      onSuccess: () => {
        message.success('Oportunidade atualizada com sucesso!')
        queryClient.invalidateQueries('deals')
        setIsEditModalVisible(false)
        setEditingDeal(null)
        editForm.resetFields()
      },
      onError: () => {
        message.error('Erro ao atualizar oportunidade')
      }
    }
  )

  const deleteDealMutation = useMutation(deleteDeal, {
    onSuccess: () => {
      message.success('Oportunidade excluída com sucesso!')
      queryClient.invalidateQueries('deals')
    },
    onError: () => {
      message.error('Erro ao excluir oportunidade')
    }
  })

  const handleCreate = () => {
    setIsCreateModalVisible(true)
  }

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal)
    editForm.setFieldsValue({
      ...deal,
      expectedCloseDate: deal.expectedCloseDate ? dayjs(deal.expectedCloseDate) : null
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (id: string) => {
    deleteDealMutation.mutate(id)
  }

  const handleBatchDelete = () => {
    selectedRowKeys.forEach((key) => {
      deleteDealMutation.mutate(key as string)
    })
    setSelectedRowKeys([])
  }

  const onFinishCreate = (values: any) => {
    createDealMutation.mutate({
      ...values,
      expectedCloseDate: values.expectedCloseDate?.format('YYYY-MM-DD')
    })
  }

  const onFinishEdit = (values: any) => {
    if (editingDeal) {
      updateDealMutation.mutate({
        id: editingDeal.id,
        data: {
          ...values,
          expectedCloseDate: values.expectedCloseDate?.format('YYYY-MM-DD')
        }
      })
    }
  }

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
      title: 'Data Prevista',
      dataIndex: 'expectedCloseDate',
      key: 'expectedCloseDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString('pt-BR') : '-',
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
          <Popconfirm
            title="Excluir oportunidade"
            description="Tem certeza que deseja excluir esta oportunidade? Esta ação não pode ser desfeita."
            onConfirm={() => handleDelete(record.id)}
            okText="Sim, excluir"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const totalValue = dealsData?.deals?.reduce((sum: number, deal: Deal) => sum + (deal.value || 0), 0) || 0

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={2}>Oportunidades</Title>
          <div style={{ color: '#666', marginTop: -8 }}>
            Total: R$ {totalValue.toLocaleString()} em {dealsData?.deals?.length || 0} oportunidades
          </div>
        </div>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title="Excluir oportunidades selecionadas"
              description={`Tem certeza que deseja excluir ${selectedRowKeys.length} oportunidades?`}
              onConfirm={handleBatchDelete}
              okText="Sim, excluir"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button danger>
                Excluir Selecionadas ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nova Oportunidade
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={dealsData?.deals || []}
        loading={isLoading}
        rowKey="id"
        rowSelection={rowSelection}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total} oportunidades`,
        }}
      />

      {/* Modal de Criação */}
      <Modal
        title="Nova Oportunidade"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={onFinishCreate}
        >
          <Form.Item
            label="Título da Oportunidade"
            name="title"
            rules={[{ required: true, message: 'Título é obrigatório' }]}
          >
            <Input placeholder="Ex: Implementação de CRM" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Form.Item
              label="Valor"
              name="value"
              rules={[{ required: true, message: 'Valor é obrigatório' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                placeholder="0.00"
                style={{ width: '100%' }}
                formatter={(value?: string | number) =>
                  `R$ ${typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value || ''}`
                }
                parser={(value?: string) =>
                  value
                    ? Number(
                        value
                          .replace(/\s/g, '')
                          .replace('R$', '')
                          .replace(/\./g, '')
                          .replace(',', '.')
                      )
                    : 0
                }
                min={0}
              />
            </Form.Item>

            <Form.Item
              label="Probabilidade (%)"
              name="probability"
              style={{ flex: 1 }}
            >
              <InputNumber
                placeholder="0"
                style={{ width: '100%' }}
                min={0}
                max={100}
                formatter={(value?: string | number) =>
                  value !== undefined && value !== null && value !== ''
                    ? `${value}%`
                    : ''
                }
                parser={(value?: string) =>
                  value ? value.replace('%', '') : ''
                }
              />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Form.Item
              label="Contato"
              name="contactId"
              rules={[{ required: true, message: 'Contato é obrigatório' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Selecione um contato" showSearch>
              {contactsData?.contacts?.map((contact: Contact) => (
                <Option key={contact.id} value={contact.id}>
                  {contact.name} - {contact.company?.name || 'Sem empresa'}
                </Option>
              ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Estágio"
              name="stage"
              rules={[{ required: true, message: 'Estágio é obrigatório' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Selecione o estágio">
                <Option value="PROSPECTING">Prospecção</Option>
                <Option value="QUALIFICATION">Qualificação</Option>
                <Option value="PROPOSAL">Proposta</Option>
                <Option value="NEGOTIATION">Negociação</Option>
                <Option value="CLOSED_WON">Fechado</Option>
                <Option value="CLOSED_LOST">Perdido</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="Data Prevista de Fechamento"
            name="expectedCloseDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Observações"
            name="notes"
          >
            <TextArea rows={3} placeholder="Observações sobre a oportunidade..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsCreateModalVisible(false)}>
                Cancelar
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createDealMutation.isLoading}
              >
                Criar Oportunidade
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        title="Editar Oportunidade"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false)
          setEditingDeal(null)
          editForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={onFinishEdit}
        >
          <Form.Item
            label="Título da Oportunidade"
            name="title"
            rules={[{ required: true, message: 'Título é obrigatório' }]}
          >
            <Input placeholder="Ex: Implementação de CRM" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Form.Item
              label="Valor"
              name="value"
              rules={[{ required: true, message: 'Valor é obrigatório' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                placeholder="0.00"
                style={{ width: '100%' }}
                formatter={(value?: string | number) =>
                  `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value?: string) =>
                  value ? value.replace(/R\$\s?|(,*)/g, '') : ''
                }
                min={0}
              />
            </Form.Item>

            <Form.Item
              label="Probabilidade (%)"
              name="probability"
              style={{ flex: 1 }}
            >
              <InputNumber
                placeholder="0"
                style={{ width: '100%' }}
                min={0}
                max={100}
                formatter={(value?: string | number) =>
                  value !== undefined && value !== null ? `${value}%` : ''
                }
                parser={(value?: string) =>
                  value ? value.replace('%', '') : ''
                }
              />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Form.Item
              label="Contato"
              name="contactId"
              rules={[{ required: true, message: 'Contato é obrigatório' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Selecione um contato" showSearch>
              {contactsData?.contacts?.map((contact: Contact) => (
                <Option key={contact.id} value={contact.id}>
                  {contact.name} - {contact.company?.name || 'Sem empresa'}
                </Option>
              ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Estágio"
              name="stage"
              rules={[{ required: true, message: 'Estágio é obrigatório' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Selecione o estágio">
                <Option value="PROSPECTING">Prospecção</Option>
                <Option value="QUALIFICATION">Qualificação</Option>
                <Option value="PROPOSAL">Proposta</Option>
                <Option value="NEGOTIATION">Negociação</Option>
                <Option value="CLOSED_WON">Fechado</Option>
                <Option value="CLOSED_LOST">Perdido</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="Data Prevista de Fechamento"
            name="expectedCloseDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Observações"
            name="notes"
          >
            <TextArea rows={3} placeholder="Observações sobre a oportunidade..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsEditModalVisible(false)
                setEditingDeal(null)
                editForm.resetFields()
              }}>
                Cancelar
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={updateDealMutation.isLoading}
              >
                Atualizar Oportunidade
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Deals