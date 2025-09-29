import React, { useState } from 'react'
import { 
  Table, 
  Button, 
  Input, 
  Card, 
  Typography, 
  Tag, 
  Avatar, 
  Space, 
  Popconfirm, 
  message,
  Modal,
  Form,
  Select,
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  UserOutlined 
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  position: string
  linkedinUrl?: string
  notes?: string
  tags?: string[]
  companyId?: string
  company: {
    id: string
    name: string
  }
  createdAt: string
}

interface Company {
  id: string
  name: string
}

interface ContactFormData {
  name: string
  email: string
  phone: string
  position: string
  linkedinUrl: string
  notes: string
  tags: string[]
  companyId: string
}

const Contacts: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  
  const queryClient = useQueryClient()

  // Fetch contacts
  const { data: contactsData, isLoading } = useQuery('contacts', async () => {
    const response = await api.get('/api/contacts')
    return response.data
  })

  // Fetch companies for dropdown
  const { data: companiesData } = useQuery('companies', async () => {
    const response = await api.get('/api/companies')
    return response.data
  })

  // Create contact mutation
  const createContactMutation = useMutation(
    async (contactData: ContactFormData) => {
      const response = await api.post('/api/contacts', contactData)
      return response.data
    },
    {
      onSuccess: () => {
        message.success('Contato criado com sucesso!')
        setIsCreateModalVisible(false)
        createForm.resetFields()
        queryClient.invalidateQueries('contacts')
      },
      onError: () => {
        message.error('Erro ao criar contato')
      }
    }
  )

  // Update contact mutation
  const updateContactMutation = useMutation(
    async ({ id, data }: { id: string; data: ContactFormData }) => {
      const response = await api.put(`/api/contacts/${id}`, data)
      return response.data
    },
    {
      onSuccess: () => {
        message.success('Contato atualizado com sucesso!')
        setIsEditModalVisible(false)
        setEditingContact(null)
        queryClient.invalidateQueries('contacts')
      },
      onError: () => {
        message.error('Erro ao atualizar contato')
      }
    }
  )

  // Delete contact mutation
  const deleteContactMutation = useMutation(
    async (id: string) => {
      await api.delete(`/api/contacts/${id}`)
    },
    {
      onSuccess: () => {
        message.success('Contato excluído com sucesso!')
        queryClient.invalidateQueries('contacts')
      },
      onError: () => {
        message.error('Erro ao excluir contato')
      }
    }
  )

  // Delete multiple contacts mutation
  const deleteMultipleMutation = useMutation(
    async (ids: string[]) => {
      await Promise.all(ids.map(id => api.delete(`/api/contacts/${id}`)))
    },
    {
      onSuccess: () => {
        message.success(`${selectedRowKeys.length} contatos excluídos com sucesso!`)
        setSelectedRowKeys([])
        queryClient.invalidateQueries('contacts')
      },
      onError: () => {
        message.error('Erro ao excluir contatos')
      }
    }
  )

  const columns: ColumnsType<Contact> = [
    {
      title: 'Contato',
      key: 'contact',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ color: '#666', fontSize: 12 }}>{record.position}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Empresa',
      dataIndex: ['company', 'name'],
      key: 'company',
      render: (companyName) => companyName || 'Não informado',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => email || 'Não informado',
    },
    {
      title: 'Telefone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || 'Não informado',
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space wrap>
          {tags?.slice(0, 2).map(tag => (
            <Tag key={tag} color="blue">{tag}</Tag>
          ))}
          {tags?.length > 2 && (
            <Tag color="default">+{tags.length - 2}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Data de Criação',
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
          <Popconfirm
            title="Excluir contato"
            description="Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita."
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

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    editForm.setFieldsValue({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      position: contact.position,
      linkedinUrl: contact.linkedinUrl,
      notes: contact.notes,
      tags: contact.tags,
      companyId: contact.companyId,
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    await deleteContactMutation.mutateAsync(id)
  }

  const handleDeleteMultiple = async () => {
    await deleteMultipleMutation.mutateAsync(selectedRowKeys as string[])
  }

  const handleAddNew = () => {
    createForm.resetFields()
    setIsCreateModalVisible(true)
  }

  const handleCreateSubmit = async (values: ContactFormData) => {
    await createContactMutation.mutateAsync(values)
  }

  const handleEditSubmit = async (values: ContactFormData) => {
    if (editingContact) {
      await updateContactMutation.mutateAsync({
        id: editingContact.id,
        data: values
      })
    }
  }

  const handleCreateCancel = () => {
    setIsCreateModalVisible(false)
    createForm.resetFields()
  }

  const handleEditCancel = () => {
    setIsEditModalVisible(false)
    setEditingContact(null)
    editForm.resetFields()
  }

  const filteredContacts = contactsData?.contacts?.filter(
    (contact: Contact) =>
      contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchText.toLowerCase()) ||
      contact.company?.name?.toLowerCase().includes(searchText.toLowerCase())
  ) || []

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Contatos</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAddNew}
          loading={createContactMutation.isLoading}
        >
          Novo Contato
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Search
            placeholder="Buscar contatos..."
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          {selectedRowKeys.length > 0 && (
            <Space>
              <Tag>{selectedRowKeys.length} selecionado(s)</Tag>
              <Popconfirm
                title="Excluir contatos selecionados"
                description="Tem certeza que deseja excluir os contatos selecionados? Esta ação não pode ser desfeita."
                onConfirm={handleDeleteMultiple}
                okText="Sim, excluir"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
              >
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  loading={deleteMultipleMutation.isLoading}
                >
                  Excluir Selecionados
                </Button>
              </Popconfirm>
            </Space>
          )}
        </div>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredContacts}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} contatos`,
          }}
        />
      </Card>

      {/* Modal de Criação */}
      <Modal
        title="Novo Contato"
        open={isCreateModalVisible}
        onCancel={handleCreateCancel}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
        >
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Form.Item
              label="Nome"
              name="name"
              rules={[{ required: true, message: 'Nome é obrigatório' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Nome completo" />
            </Form.Item>

            <Form.Item
              label="Cargo"
              name="position"
              style={{ flex: 1 }}
            >
              <Input placeholder="Cargo ou função" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { type: 'email', message: 'Email inválido' }
              ]}
              style={{ flex: 1 }}
            >
              <Input placeholder="email@exemplo.com" />
            </Form.Item>

            <Form.Item
              label="Telefone"
              name="phone"
              style={{ flex: 1 }}
            >
              <Input placeholder="(11) 99999-9999" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Form.Item
              label="Empresa"
              name="companyId"
              style={{ flex: 1 }}
            >
              <Select 
                placeholder="Selecionar empresa"
                allowClear
                showSearch
                optionFilterProp="children"
                loading={!companiesData}
              >
                {companiesData?.companies?.map((company: Company) => (
                  <Option key={company.id} value={company.id}>
                    {company.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="LinkedIn"
              name="linkedinUrl"
              style={{ flex: 1 }}
            >
              <Input placeholder="URL do LinkedIn" />
            </Form.Item>
          </div>

          <Form.Item
            label="Tags"
            name="tags"
          >
            <Select
              mode="tags"
              placeholder="Adicionar tags"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Observações"
            name="notes"
          >
            <TextArea 
              rows={3}
              placeholder="Observações sobre o contato"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCreateCancel}>
                Cancelar
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createContactMutation.isLoading}
              >
                Criar Contato
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        title={`Editar Contato - ${editingContact?.name}`}
        open={isEditModalVisible}
        onCancel={handleEditCancel}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Form.Item
              label="Nome"
              name="name"
              rules={[{ required: true, message: 'Nome é obrigatório' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Nome completo" />
            </Form.Item>

            <Form.Item
              label="Cargo"
              name="position"
              style={{ flex: 1 }}
            >
              <Input placeholder="Cargo ou função" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { type: 'email', message: 'Email inválido' }
              ]}
              style={{ flex: 1 }}
            >
              <Input placeholder="email@exemplo.com" />
            </Form.Item>

            <Form.Item
              label="Telefone"
              name="phone"
              style={{ flex: 1 }}
            >
              <Input placeholder="(11) 99999-9999" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Form.Item
              label="Empresa"
              name="companyId"
              style={{ flex: 1 }}
            >
              <Select 
                placeholder="Selecionar empresa"
                allowClear
                showSearch
                optionFilterProp="children"
                loading={!companiesData}
              >
                {companiesData?.companies?.map((company: Company) => (
                  <Option key={company.id} value={company.id}>
                    {company.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="LinkedIn"
              name="linkedinUrl"
              style={{ flex: 1 }}
            >
              <Input placeholder="URL do LinkedIn" />
            </Form.Item>
          </div>

          <Form.Item
            label="Tags"
            name="tags"
          >
            <Select
              mode="tags"
              placeholder="Adicionar tags"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Observações"
            name="notes"
          >
            <TextArea 
              rows={3}
              placeholder="Observações sobre o contato"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleEditCancel}>
                Cancelar
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={updateContactMutation.isLoading}
              >
                Salvar Alterações
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Contacts