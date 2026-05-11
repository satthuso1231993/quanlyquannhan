import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, theme } from 'antd';
import { 
  BarChart3, 
  Users, 
  UserSquare2, 
  FileCheck, 
  LogOut, 
  Settings, 
  Bell, 
  Menu as MenuIcon,
  Search,
  ChevronLeft,
  Moon,
  Sun,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

const { Header, Sider, Content } = AntLayout;

export const AppLayout: React.FC<{ children: React.ReactNode, onMenuSelect?: (key: string) => void, activeKey?: string }> = ({ children, onMenuSelect, activeKey }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { user, appUser, logout, isAdmin } = useAuth();
  
  const { token } = theme.useToken();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <BarChart3 size={18} />,
      label: 'Tổng quan',
    },
    {
      key: 'personnel',
      icon: <Users size={18} />,
      label: 'Quân nhân',
    },
    {
      key: 'reserve',
      icon: <UserSquare2 size={18} />,
      label: 'Sĩ quan dự bị',
    },
    {
      key: 'conscripts',
      icon: <FileCheck size={18} />,
      label: 'Công dân NVQS',
    },
    {
      key: 'reports',
      icon: <BarChart3 size={18} />,
      label: 'Báo cáo - Thống kê',
    },
    ...(isAdmin ? [
      {
        key: 'audit',
        icon: <ClipboardList size={18} />,
        label: 'Nhật ký hệ thống',
      },
      {
        key: 'settings',
        icon: <Settings size={18} />,
        label: 'Cài đặt',
      }
    ] : []),
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Thông tin cá nhân',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <AntLayout className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        className="border-r border-gray-200 dark:border-gray-800"
        style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}
      >
        <div className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-military-green rounded flex items-center justify-center text-military-gold">
            <ShieldCheck size={20} />
          </div>
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg tracking-tight text-military-green"
            >
              QUẢN LÝ QUÂN LỰC
            </motion.span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeKey || 'dashboard']}
          items={menuItems}
          className="border-none mt-4"
          onClick={({ key }) => onMenuSelect?.(key)}
        />
      </Sider>
      
      <AntLayout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header className="bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuIcon size={20} /> : <ChevronLeft size={20} />}
              onClick={() => setCollapsed(!collapsed)}
              className="hover:bg-gray-100"
            />
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-64">
              <Search size={16} className="text-gray-500" />
              <input 
                placeholder="Tìm kiếm hồ sơ..." 
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              type="text" 
              icon={darkMode ? <Sun size={20} /> : <Moon size={20} />} 
              onClick={() => setDarkMode(!darkMode)}
            />
            <Button type="text" icon={<Bell size={20} />} className="relative">
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Button>
            
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <div className="flex items-center gap-3 cursor-pointer p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold leading-tight">{appUser?.displayName}</div>
                  <div className="text-[10px] text-gray-500">{appUser?.role}</div>
                </div>
                <Avatar src={user?.photoURL} className="bg-military-green">
                  {user?.displayName?.charAt(0)}
                </Avatar>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
