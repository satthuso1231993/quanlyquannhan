import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Space, App as AntdApp, Row, Col, Divider, Typography } from 'antd';
import { Shield, UserPlus, Trash2, Settings, Lock, Key, Users, Database, Copy } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, db, handleFirestoreError, OperationType } from '../lib/localDb';
import { AppUser, UserRole } from '../types/military';
import { useAuth } from '../context/AuthContext';

const { Paragraph } = Typography;

export const SettingsView: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { appUser, isAdmin, changePassword } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const { message } = AntdApp.useApp();

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() } as AppUser)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });
    return unsubscribe;
  }, [isAdmin]);

  const handleUpdateRole = async (values: any) => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        role: values.role,
        unit: values.unit,
        displayName: values.displayName
      });
      message.success('Cập nhật quyền hạn thành công');
      setIsModalOpen(false);
    } catch (error) {
      message.error('Lỗi khi cập nhật');
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      await changePassword(values.newPassword);
      message.success('Đổi mật khẩu thành công');
      setIsPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi đổi mật khẩu');
    }
  };

  const columns = [
    {
      title: 'Cán bộ',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text: string, record: AppUser) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-xs text-gray-400">{record.email}</div>
        </div>
      )
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Quyền hạn',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => {
        const roleInfo: Record<UserRole, { color: string, label: string, group: string }> = {
          ADMIN: { color: 'red', label: 'Quản trị viên', group: 'Quản trị' },
          COMMANDER: { color: 'purple', label: 'Chỉ huy', group: 'Quản trị' },
          MANAGER: { color: 'blue', label: 'Cán bộ quản lý', group: 'Sử dụng' },
          CLERK: { color: 'green', label: 'Nhân viên nhập liệu', group: 'Sử dụng' },
          VIEWER: { color: 'default', label: 'Người xem', group: 'Sử dụng' }
        };
        const info = roleInfo[role] || { color: 'default', label: role, group: 'Khác' };
        return (
          <Space direction="vertical" size={0}>
            <Tag color={info.color}>{info.label}</Tag>
            <span className="text-[10px] text-gray-400 ml-1">{info.group}</span>
          </Space>
        );
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (record: AppUser) => (
        <Space>
          <Button 
            type="text" 
            icon={<Settings size={16} />} 
            disabled={!isAdmin || record.uid === appUser?.uid}
            onClick={() => {
              setEditingUser(record);
              form.setFieldsValue(record);
              setIsModalOpen(true);
            }}
          />
          <Button 
            type="text" 
            danger 
            icon={<Trash2 size={16} />} 
            disabled={!isAdmin || record.uid === appUser?.uid}
            onClick={() => {
              Modal.confirm({
                title: 'Xóa tài khoản',
                content: `Bạn có chắc chắn muốn xóa tài khoản của ${record.displayName}?`,
                onOk: async () => {
                  try {
                    await deleteDoc(doc(db, 'users', record.uid));
                    message.success('Đã xóa tài khoản');
                  } catch (e) {
                    message.error('Lỗi khi xóa tài khoản');
                  }
                }
              });
            }}
          />
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-military-green text-military-gold rounded-full">
            <Lock size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cấu hình hệ thống</h1>
            <p className="text-sm text-gray-500">Phân quyền tài khoản Quản trị và tài khoản Sử dụng.</p>
          </div>
        </div>
        {isAdmin && (
          <Button type="primary" className="bg-military-green flex items-center gap-2" icon={<UserPlus size={18} />} onClick={() => message.info('Vui lòng hướng dẫn cán bộ tự đăng ký tài khoản ở màn hình Đăng ký, sau đó bạn sẽ cấp quyền cho họ tại đây.')}>
            Thêm cán bộ
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Col span={24} lg={16}>
          <Card title="Danh sách tài khoản hệ thống" className="rounded-xl border-none shadow-sm h-full">
            <Table 
              dataSource={users} 
              columns={columns} 
              loading={loading} 
              rowKey="uid"
              pagination={false}
            />
          </Card>
        </Col>
        
        <Col span={24} lg={8}>
          <Card title="Cấu hình tài khoản" className="rounded-xl border-none shadow-sm h-full">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Tài khoản hiện tại</div>
                <div className="font-bold">{appUser?.displayName}</div>
                <div className="text-xs text-gray-400">{appUser?.email}</div>
              </div>
              <Button 
                block 
                icon={<Key size={16} />} 
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Đổi mật khẩu
              </Button>
              
              <Divider dashed />
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="font-bold text-red-800 flex items-center gap-2 mb-1">
                  <Shield size={16} /> Nhóm Quản trị
                </div>
                <p className="text-xs text-red-700">Có quyền cấu hình hệ thống, quản lý tài khoản, xem nhật ký và thay đổi các thông số bảo mật cao.</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="font-bold text-blue-800 flex items-center gap-2 mb-1">
                  <Users size={16} /> Nhóm Sử dụng
                </div>
                <p className="text-xs text-blue-700">Có quyền nhập liệu, quản lý hồ sơ nhân sự, xuất báo cáo và tra cứu thông tin theo phân cấp đơn vị.</p>
              </div>
              <Divider />
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Trạng thái máy chủ</div>
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Hoạt động bình thường
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </div>

      <Modal
        title="Cấu hình tài khoản"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-military-green' }}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateRole} className="mt-4">
          <Form.Item name="displayName" label="Tên hiển thị">
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Vai trò & Nhóm quyền">
            <Select>
              <Select.OptGroup label="Nhóm Quản trị (Admin)">
                <Select.Option value="ADMIN">Quản trị viên hệ thống</Select.Option>
                <Select.Option value="COMMANDER">Chỉ huy đơn vị</Select.Option>
              </Select.OptGroup>
              <Select.OptGroup label="Nhóm Sử dụng (Users)">
                <Select.Option value="MANAGER">Cán bộ quản lý</Select.Option>
                <Select.Option value="CLERK">Nhân viên nhập liệu</Select.Option>
                <Select.Option value="VIEWER">Người xem</Select.Option>
              </Select.OptGroup>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Lock size={20} className="text-military-green" />
            <span>Thay đổi mật khẩu</span>
          </div>
        }
        open={isPasswordModalOpen}
        onCancel={() => setIsPasswordModalOpen(false)}
        onOk={() => passwordForm.submit()}
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item 
            name="newPassword" 
            label="Mật khẩu mới" 
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới..." />
          </Form.Item>
          <Form.Item 
            name="confirmPassword" 
            label="Xác nhận mật khẩu" 
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu mới..." />
          </Form.Item>
        </Form>
        <div className="bg-amber-50 p-3 rounded text-xs text-amber-700 mt-2">
          Lưu ý: Sau khi đổi mật khẩu, bạn cần sử dụng mật khẩu mới cho các lần đăng nhập sau.
        </div>
      </Modal>
    </div>
  );
};
