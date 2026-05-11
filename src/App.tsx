import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './components/Dashboard';
import { PersonnelList } from './components/PersonnelList';
import { PersonnelEntryView } from './components/PersonnelEntryView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AuditLogsView } from './components/AuditLogsView';
import { Button, ConfigProvider, theme, Form, Input, Divider, Tabs } from 'antd';
import { App as AntdApp } from 'antd';
import { ShieldCheck, LogIn, Mail, Lock, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

const LoginView = () => {
  const { login, loginWithEmail, registerWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { message } = AntdApp.useApp();
  
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (activeTab === 'login') {
        let email = values.email;
        if (!email.includes('@')) {
          email = `${email}@vms.vn`;
        }
        await loginWithEmail(email, values.password);
        message.success('Đăng nhập thành công');
      } else if (activeTab === 'admin') {
        // Map adminCode to a internal email format
        const email = `${values.adminCode}@admin.vms`;
        await loginWithEmail(email, values.password);
        message.success('Đăng nhập quản trị thành công');
      } else {
        await registerWithEmail(values.email, values.password, values.displayName, values.unit);
        message.success('Đăng ký tài khoản thành công');
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2c3e2d] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
      >
        <div className="bg-[#2c3e2d] p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-2xl font-bold mb-1">QUẢN LÝ QUÂN LỰC</h1>
          <p className="text-white/60 text-sm">Hệ thống Quản lý Nhân sự & Quân sự</p>
        </div>

        <div className="p-8">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            centered
            items={[
              { key: 'login', label: 'Đăng nhập' },
              { key: 'admin', label: 'Mã Admin' },
              { key: 'register', label: 'Yêu cầu quyền' }
            ]}
          />

          <Form layout="vertical" onFinish={onFinish} className="mt-4">
            {activeTab === 'register' && (
              <>
                <Form.Item 
                  name="displayName" 
                  label="Họ và tên" 
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                  <Input placeholder="Nguyễn Văn A" />
                </Form.Item>
                <Form.Item 
                  name="unit" 
                  label="Đơn vị / Địa phương" 
                  rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
                >
                  <Input placeholder="Xã Bình Minh / Ban Chỉ huy" />
                </Form.Item>
              </>
            )}
            
            {activeTab === 'login' && (
              <Form.Item 
                name="email" 
                label="Tài khoản (Email)" 
                rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
              >
                <Input prefix={<Mail size={16} className="text-gray-400" />} placeholder="admin@vms.vn hoặc tên đăng nhập" />
              </Form.Item>
            )}

            {activeTab === 'admin' && (
              <Form.Item 
                name="adminCode" 
                label="Mã định danh Quản trị" 
                rules={[{ required: true, message: 'Vui lòng nhập mã admin' }]}
              >
                <Input prefix={<ShieldCheck size={16} className="text-gray-400" />} placeholder="Nhập mã định danh..." />
              </Form.Item>
            )}

            {activeTab === 'register' && (
              <Form.Item 
                name="email" 
                label="Email đăng ký" 
                extra="Lưu ý: Dùng admin@vms.vn để được tự động cấp quyền Quản trị (Admin)."
                rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}
              >
                <Input prefix={<Mail size={16} className="text-gray-400" />} placeholder="email@example.com" />
              </Form.Item>
            )}
            
            <Form.Item 
              name="password" 
              label={activeTab === 'admin' ? "Mật khẩu Admin" : "Mật khẩu"}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password prefix={<Lock size={16} className="text-gray-400" />} placeholder="••••••••" />
            </Form.Item>

            <Button 
              type="primary" 
              size="large" 
              block 
              htmlType="submit"
              loading={loading}
              className="bg-[#2c3e2d] h-12 mt-2"
            >
              {activeTab === 'login' ? 'Đăng nhập hệ thống' : activeTab === 'admin' ? 'Xác thực Quản trị' : 'Gửi yêu cầu đăng ký'}
            </Button>
          </Form>

          <Divider plain className="text-xs text-gray-400">Hoặc tiếp tục với</Divider>

          <Button 
            block 
            icon={<LogIn size={18} />} 
            onClick={login}
            className="h-11 flex items-center justify-center gap-2 border-gray-200"
          >
            Google Account
          </Button>

          <p className="text-[10px] text-gray-400 mt-6 text-center leading-relaxed">
            * Mọi hành vi truy cập trái phép hoặc sử dụng sai mục đích sẽ bị xử lý theo quy định của Quân đội và Pháp luật.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-military-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-military-green font-medium">Đang khởi động hệ thống...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'entry': return <PersonnelEntryView />;
      case 'personnel': return <PersonnelList type="QUAN_NHAN" />;
      case 'reserve': return <PersonnelList type="SI_QUAN_DU_BI" />;
      case 'conscripts': return <PersonnelList type="CONG_DAN_NVQS" />;
      case 'reports': return <ReportsView />;
      case 'settings': return <SettingsView />;
      case 'audit': return <AuditLogsView />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppLayout activeKey={currentView} onMenuSelect={setCurrentView}>
      <div className="flex flex-wrap gap-2 mb-6 md:hidden">
        {['dashboard', 'entry', 'personnel', 'reserve', 'conscripts', 'reports'].map(v => (
          <Button 
            key={v}
            type={currentView === v ? 'primary' : 'default'}
            className={currentView === v ? 'bg-military-green' : ''}
            onClick={() => setCurrentView(v)}
            size="small"
          >
            {v === 'dashboard' ? 'Tổng quan' : v === 'entry' ? 'Nhập thông tin' : v === 'personnel' ? 'Quân nhân' : v === 'reserve' ? 'Sĩ quan' : v === 'conscripts' ? 'Công dân' : 'Báo cáo'}
          </Button>
        ))}
      </div>
      {renderView()}
    </AppLayout>
  );
};

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2c3e2d',
          borderRadius: 8,
          fontFamily: 'Inter, sans-serif',
        },
        components: {
          Button: {
            colorPrimary: '#2c3e2d',
            colorPrimaryHover: '#3d563e',
          },
          Table: {
            headerBg: '#fafafa',
          }
        }
      }}
    >
      <AntdApp>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
