import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Input, Space } from 'antd';
import { ClipboardList, Search, Clock } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Audit log error:", error);
      setLoading(false);
    });
    return unsubscribe;
  }, [isAdmin]);

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (t: string) => format(new Date(t), 'HH:mm:ss dd/MM/yyyy'),
      width: 180,
    },
    {
      title: 'Tài khoản',
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const colors: any = {
          'CREATE': 'green',
          'UPDATE': 'blue',
          'DELETE': 'red',
          'LOGIN': 'purple'
        };
        return <Tag color={colors[action] || 'default'}>{action}</Tag>;
      }
    },
    {
      title: 'Chi tiết thao tác',
      dataIndex: 'details',
      key: 'details',
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-6 rounded-xl border border-gray-100 shadow-sm items-center gap-4">
        <div className="p-3 bg-military-green text-military-gold rounded-full">
          <Clock size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký hoạt động</h1>
          <p className="text-sm text-gray-500">Theo dõi mọi thay đổi và truy cập vào hệ thống để đảm bảo an ninh dữ liệu.</p>
        </div>
      </div>

      <Card className="rounded-xl border-none shadow-sm">
        <div className="mb-6">
          <Input 
            prefix={<Search size={16} className="text-gray-400" />} 
            placeholder="Tìm kiếm theo tài khoản hoặc hành động..." 
            className="max-w-md"
          />
        </div>
        <Table 
          dataSource={logs} 
          columns={columns} 
          loading={loading} 
          rowKey="id"
          pagination={{ pageSize: 15 }}
        />
      </Card>
    </div>
  );
};
