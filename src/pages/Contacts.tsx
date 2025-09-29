import React, { useState } from 'react'
import { Table, Button, Input, Card, Typography, Tag, Avatar, Space, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery } from 'react-query'
import { fetchContacts } from '../services/api'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { Search } = Input

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  position: string
  company: {
    name: string
  }
  createdAt: string
}

const Contacts: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const { data: contactsData, isLoading, refetch } = useQuery('contacts', fetchContacts)

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
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Telefone',
      dataIndex: 'phone',
      key: 'phone',
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
            title="Tem certeza que deseja excluir este contato?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleEdit = (contact: Contact) => {
    message.info(`Editar contato: ${contact.name}`)
  }

  const handleDelete = async (id: string) => {
    try {
      // Aqui seria implementada a chamada à API para deletar
      message.success('Contato excluído com sucesso!')
      refetch()
    } catch (error) {
      message.error('Erro ao excluir contato')
    }
  }

  const handleAddNew = () => {
    message.info('Adicionar novo contato')
  }

  const filteredContacts = contactsData?.contacts?.filter(
    (contact: Contact) =>
      contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchText.toLowerCase()) ||
      contact.company?.name.toLowerCase().includes(searchText.toLowerCase())
  ) || []

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Contatos</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
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
                title="Excluir contatos selecionados?"
                onConfirm={() => {
                  setSelectedRowKeys([])
                  message.success('Contatos excluídos!')
                }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Excluir
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
    </div>
  )
}

export default Contacts