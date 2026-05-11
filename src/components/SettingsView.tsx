import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Space, App as AntdApp, Row, Col, Divider, Typography } from 'antd';
import { Shield, UserPlus, Trash2, Settings, Lock, Key, Users, Database, Copy } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AppUser, UserRole } from '../types/military';
import { useAuth } from '../context/AuthContext';

const { Paragraph } = Typography;

export const SettingsView: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { appUser, isAdmin, changePassword } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
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

  const supabaseSql = `-- Copy và dán mã SQL này vào mục SQL Editor trong Supabase
CREATE TABLE IF NOT EXISTS personnel (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "fullName" TEXT,
  "birthDate" TEXT,
  "gender" TEXT,
  "identityCard" TEXT,
  "idIssueDate" TEXT,
  "idIssuePlace" TEXT,
  "ethnicity" TEXT,
  "religion" TEXT,
  "maritalStatus" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "occupation" TEXT,
  "militaryCode" TEXT,
  "type" TEXT,
  "address" JSONB,
  "militaryInfo" JSONB,
  "education" JSONB,
  "health" JSONB,
  "createdAt" TEXT,
  "updatedAt" TEXT,
  "createdBy" TEXT
);

-- Bật RLS và thêm Policy để ứng dụng có quyền truy cập
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép truy cập toàn bộ từ frontend" ON personnel FOR ALL USING (true) WITH CHECK (true);
`;

  const copySql = () => {
    navigator.clipboard.writeText(supabaseSql);
    message.success('Đã copy mã SQL!');
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
          <Button type="primary" className="bg-military-green flex items-center gap-2" icon={<UserPlus size={18} />} onClick={() => message.info('Tính năng đang được phát triển. Hiện tại người dùng cần đăng nhập Google lần đầu để tạo tài khoản.')}>
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
              <div className="p-4 bg-gray-50 rounded-lg mt-4">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Cơ sở dữ liệu Supabase</div>
                <div className="flex items-center gap-2 text-indigo-600 font-medium">
                  <Database size={16} />
                  Chế độ lưu trữ liên kết
                </div>
                <Button 
                  size="small" 
                  className="mt-3 w-full" 
                  onClick={() => setIsSqlModalOpen(true)}
                >
                  Sao chép SQL Khởi tạo bảng
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 text-indigo-700">
            <Database size={20} />
            <span>Hướng dẫn khởi tạo bảng Supabase</span>
          </div>
        }
        open={isSqlModalOpen}
        onCancel={() => setIsSqlModalOpen(false)}
        footer={[
          <Button key="copy" type="primary" className="bg-indigo-600" icon={<Copy size={16} />} onClick={copySql}>
            Copy SQL
          </Button>,
          <Button key="close" onClick={() => setIsSqlModalOpen(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        <div className="space-y-4 pt-4">
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-sm text-indigo-800">
            Ứng dụng frontend không có quyền tự động tạo bảng (CREATE TABLE) trên Supabase vì lý do bảo mật. 
            Vui lòng đăng nhập vào tài khoản Supabase của bạn, vào mục <strong>SQL Editor</strong>, dán và chạy đoạn mã dưới đây để khởi tạo bảng.
          </div>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">{supabaseSql}</pre>
          </div>
        </div>
      </Modal>

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
