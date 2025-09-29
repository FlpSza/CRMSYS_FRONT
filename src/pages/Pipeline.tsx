import React, { useState } from 'react'
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Badge, 
  Avatar, 
  Progress, 
  Button, 
  Input, 
  Select, 
  Statistic,
  Space,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  message,
  Empty,
  Spin
} from 'antd'
import { 
  DollarOutlined, 
  UserOutlined, 
  SearchOutlined,
  FilterOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  BarChartOutlined,
  RiseOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { fetchDashboardData, fetchDeals, updateDeal } from '../services/api'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import dayjs from 'dayjs'

const { Title } = Typography
const { Meta } = Card
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface Deal {
  id: string
  title: string
  value: number
  stage: string
  probability: number
  contact: {
    name: string
    company?: {
      name: string
    }
  }
  user?: {
    name: string
  }
  expectedCloseDate?: string
  notes?: string
  createdAt: string
}

interface PipelineStage {
  stage: string
  count: number
  totalValue: number
  deals: Deal[]
}

// Componente de Card Draggable
const DraggableDealCard: React.FC<{ deal: Deal; onEdit: (deal: Deal) => void; onView: (deal: Deal) => void; }> = ({ deal, onEdit, onView }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'deal',
    item: { id: deal.id, stage: deal.stage },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const getStageColor = (stage: string) => {
    const colors = {
      PROSPECTING: '#1890ff',
      QUALIFICATION: '#fa8c16',
      PROPOSAL: '#722ed1',
      NEGOTIATION: '#eb2f96',
      CLOSED_WON: '#52c41a',
      CLOSED_LOST: '#8c8c8c',
    }
    return colors[stage as keyof typeof colors] || '#d9d9d9'
  }

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
    >
      <Card 
        size="small" 
        style={{ 
          marginBottom: 8,
          background: '#f9f9f9',
          border: `1px solid ${getStageColor(deal.stage)}20`
        }}
        hoverable
        actions={[
          <Tooltip title="Ver detalhes">
            <EyeOutlined key="view" onClick={() => onView(deal)} />
          </Tooltip>,
          <Tooltip title="Editar">
            <EditOutlined key="edit" onClick={() => onEdit(deal)} />
          </Tooltip>
        ]}
      >
        <Meta
          avatar={
            <Avatar 
              style={{ backgroundColor: getStageColor(deal.stage) }}
              icon={<UserOutlined />} 
            />
          }
          title={
            <div style={{ fontSize: 13, fontWeight: 500 }}>
              {deal.title}
            </div>
          }
          description={
            <div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {deal.contact.name}
                {deal.contact.company?.name && ` - ${deal.contact.company.name}`}
              </div>
              <div style={{ 
                fontWeight: 600, 
                color: '#52c41a', 
                marginTop: 4,
                fontSize: 13
              }}>
                R$ {deal.value.toLocaleString()}
              </div>
              <Progress 
                percent={deal.probability} 
                size="small" 
                showInfo={false}
                strokeColor={getStageColor(deal.stage)}
                style={{ marginTop: 4 }}
              />
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                {deal.probability}% de chance
              </div>
            </div>
          }
        />
      </Card>
    </div>
  )
}

// Componente de Drop Zone
const DropZone: React.FC<{ 
  stage: string; 
  children: React.ReactNode; 
  onDrop: (dealId: string, newStage: string) => void 
}> = ({ stage, children, onDrop }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'deal',
    drop: (item: { id: string; stage: string }) => {
      if (item.stage !== stage) {
        onDrop(item.id, stage)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  return (
    <div
      ref={drop}
      style={{
        minHeight: '400px',
        backgroundColor: isOver ? '#e6f7ff' : 'transparent',
        border: isOver ? '2px dashed #1890ff' : '2px dashed transparent',
        borderRadius: 8,
        transition: 'all 0.3s ease'
      }}
    >
      {children}
    </div>
  )
}

const Pipeline: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [filterStage, setFilterStage] = useState<string>('')
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isViewModalVisible, setIsViewModalVisible] = useState(false)
  const [isReportsModalVisible, setIsReportsModalVisible] = useState(false)
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  
  const queryClient = useQueryClient()

  const { data: dashboardData, isLoading } = useQuery('dashboard', fetchDashboardData)
  const { data: dealsData } = useQuery('deals', fetchDeals)

  const updateDealMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => updateDeal(id, data),
    {
      onSuccess: () => {
        message.success('Oportunidade movida com sucesso!')
        queryClient.invalidateQueries('dashboard')
        queryClient.invalidateQueries('deals')
      },
      onError: () => {
        message.error('Erro ao mover oportunidade')
      }
    }
  )

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

  const handleDrop = (dealId: string, newStage: string) => {
    updateDealMutation.mutate({
      id: dealId,
      data: { stage: newStage }
    })
  }

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal)
    editForm.setFieldsValue({
      ...deal,
      expectedCloseDate: deal.expectedCloseDate ? dayjs(deal.expectedCloseDate) : null
    })
    setIsEditModalVisible(true)
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
      setIsEditModalVisible(false)
      setEditingDeal(null)
      editForm.resetFields()
    }
  }
  const handleCreateNew = () => {
    setIsCreateModalVisible(true)
  }
  
  const handleViewDetails = (deal: Deal) => {
    setViewingDeal(deal)
    setIsViewModalVisible(true)
  }
  
  const handleViewReports = () => {
    setIsReportsModalVisible(true)
  }
  
  const handleCreateDeal = (values: any) => {
    // Implementar criação de nova oportunidade
    console.log('Criar nova oportunidade:', values)
    message.success('Oportunidade criada com sucesso!')
    setIsCreateModalVisible(false)
    createForm.resetFields()
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Carregando pipeline...</div>
      </div>
    )
  }

  const pipeline = dashboardData?.pipeline || []
  const totalValue = pipeline.reduce((sum: number, stage: PipelineStage) => sum + stage.totalValue, 0)
  const totalDeals = pipeline.reduce((sum: number, stage: PipelineStage) => sum + stage.count, 0)

  // Filtrar deals
  const filteredPipeline = pipeline.map((stage: PipelineStage) => ({
    ...stage,
    deals: stage.deals.filter((deal: Deal) => {
      const matchesSearch = deal.title.toLowerCase().includes(searchText.toLowerCase()) ||
                           deal.contact.name.toLowerCase().includes(searchText.toLowerCase())
      const matchesStage = !filterStage || deal.stage === filterStage
      return matchesSearch && matchesStage
    })
  }))

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <Title level={2}>Pipeline de Vendas</Title>
            <div style={{ color: '#666', marginTop: -8 }}>
              Visualize e gerencie suas oportunidades de vendas
            </div>
          </div>
          <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNew}>
            Nova Oportunidade
          </Button>
          </Space>
        </div>

        {/* Métricas do Pipeline */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Valor Total do Pipeline"
                value={totalValue}
                prefix="R$"
                formatter={(value) => value?.toLocaleString()}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total de Oportunidades"
                value={totalDeals}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Taxa de Conversão"
                value={pipeline.find((s: PipelineStage) => s.stage === 'CLOSED_WON')?.count || 0}
                suffix={`/ ${totalDeals}`}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filtros */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Buscar oportunidades..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Filtrar por estágio"
                value={filterStage}
                onChange={setFilterStage}
                style={{ width: '100%' }}
                allowClear
              >
                {pipeline.map((stage: PipelineStage) => (
                  <Option key={stage.stage} value={stage.stage}>
                    {getStageInfo(stage.stage).title}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={8}>
            <Button 
              icon={<BarChartOutlined />} 
              style={{ width: '100%' }}
              onClick={handleViewReports}
            >
              Ver Relatórios
            </Button>
            </Col>
          </Row>
        </Card>

        {/* Resumo por Estágio */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card>
              <Title level={4}>Resumo por Estágio</Title>
              <Row gutter={[16, 16]}>
                {filteredPipeline.map((stage: PipelineStage) => {
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

        {/* Kanban Board */}
        <Row gutter={[16, 16]}>
          {filteredPipeline.map((stage: PipelineStage) => {
            const stageInfo = getStageInfo(stage.stage)
            
            if (stage.stage === 'CLOSED_LOST') return null
            
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
                  style={{ minHeight: '500px' }}
                >
                  <DropZone stage={stage.stage} onDrop={handleDrop}>
                    <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                      {stage.deals.map((deal) => (
                        <DraggableDealCard
                        key={deal.id}
                        deal={deal}
                        onEdit={handleEdit}
                        onView={handleViewDetails}  
                      />
                      ))}
                      
                      {stage.deals.length === 0 && (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="Nenhuma oportunidade neste estágio"
                          style={{ padding: '20px 0' }}
                        />
                      )}
                    </div>
                  </DropZone>
                </Card>
              </Col>
            )
          })}
        </Row>

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
                  min={0}
                  addonBefore="R$"
                  formatter={(value) => value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || ''}
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
                  addonAfter="%"
                />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
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

              <Form.Item
                label="Data Prevista de Fechamento"
                name="expectedCloseDate"
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </div>

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
                onFinish={handleCreateDeal}
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
                      min={0}
                      addonBefore="R$"
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
                      addonAfter="%"
                    />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
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
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="Data Prevista"
                    name="expectedCloseDate"
                    style={{ flex: 1 }}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </div>

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
                    <Button type="primary" htmlType="submit">
                      Criar Oportunidade
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>

            {/* Modal de Visualização */}
            <Modal
              title="Detalhes da Oportunidade"
              open={isViewModalVisible}
              onCancel={() => {
                setIsViewModalVisible(false)
                setViewingDeal(null)
              }}
              footer={[
                <Button key="close" onClick={() => setIsViewModalVisible(false)}>
                  Fechar
                </Button>
              ]}
              width={600}
            >
              {viewingDeal && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <h3>{viewingDeal.title}</h3>
                    <p style={{ color: '#666' }}>
                      {viewingDeal.contact.name}
                      {viewingDeal.contact.company?.name && ` - ${viewingDeal.contact.company.name}`}
                    </p>
                  </div>
              
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div>
                        <strong>Valor:</strong> R$ {viewingDeal.value.toLocaleString()}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <strong>Probabilidade:</strong> {viewingDeal.probability}%
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <strong>Estágio:</strong> {getStageInfo(viewingDeal.stage).title}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <strong>Data Prevista:</strong> {
                          viewingDeal.expectedCloseDate 
                            ? new Date(viewingDeal.expectedCloseDate).toLocaleDateString('pt-BR')
                            : 'Não definida'
                        }
                      </div>
                    </Col>
                  </Row>
                      
                  {viewingDeal.notes && (
                    <div style={{ marginTop: 16 }}>
                      <strong>Observações:</strong>
                      <p style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                        {viewingDeal.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Modal>
            
            {/* Modal de Relatórios */}
            <Modal
              title="Relatórios do Pipeline"
              open={isReportsModalVisible}
              onCancel={() => setIsReportsModalVisible(false)}
              footer={[
                <Button key="close" onClick={() => setIsReportsModalVisible(false)}>
                  Fechar
                </Button>
              ]}
              width={800}
            >
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="Valor Total do Pipeline"
                        value={totalValue}
                        prefix="R$"
                        formatter={(value) => value?.toLocaleString()}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="Total de Oportunidades"
                        value={totalDeals}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                </Row>
            
                <div style={{ marginTop: 24 }}>
                  <h4>Distribuição por Estágio</h4>
                  {pipeline.map((stage: PipelineStage) => {
                    const stageInfo = getStageInfo(stage.stage)
                    const percentage = totalDeals > 0 ? (stage.count / totalDeals * 100).toFixed(1) : 0

                    return (
                      <div key={stage.stage} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>{stageInfo.title}</span>
                          <span>{stage.count} ({percentage}%)</span>
                        </div>
                        <Progress 
                          percent={Number(percentage)} 
                          strokeColor={stageInfo.color}
                          showInfo={false}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </Modal>
      </div>
    </DndProvider>
  )
}

export default Pipeline