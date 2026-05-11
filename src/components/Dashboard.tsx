import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Table, Tag } from 'antd';
import { 
  Users, 
  UserPlus, 
  ShieldAlert, 
  Award, 
  TrendingUp, 
  Activity,
  Heart,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { collection, onSnapshot, query, orderBy, limit, db } from '../lib/localDb';
import { PersonnelProfile } from '../types/military';

const COLORS = ['#2c3e2d', '#c5a059', '#1a1a1a', '#8884d8'];

export const Dashboard: React.FC = () => {
  const [personnel, setPersonnel] = useState<PersonnelProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      setPersonnel(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonnelProfile)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const stats = [
    { title: 'Quân nhân', count: personnel.filter(p => p.type === 'QUAN_NHAN').length.toLocaleString(), icon: <Users className="text-blue-500" /> },
    { title: 'Sĩ quan dự bị', count: personnel.filter(p => p.type === 'SI_QUAN_DU_BI').length.toLocaleString(), icon: <UserPlus className="text-green-500" /> },
    { title: 'Công dân NVQS', count: personnel.filter(p => p.type === 'CONG_DAN_NVQS').length.toLocaleString(), icon: <Activity className="text-orange-500" /> },
    { title: 'Tổng hồ sơ', count: personnel.length.toLocaleString(), icon: <Award className="text-yellow-500" /> },
  ];

  const recentData = personnel
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const wardGroups = personnel.reduce((acc, p) => {
    const ward = p.address?.ward || 'Chưa rõ';
    acc[ward] = (acc[ward] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const localData = Object.keys(wardGroups).map(name => ({
    name, qty: wardGroups[name]
  }));

  const totalProfiles = personnel.length;
  const health1 = personnel.filter(p => p.health?.category === 'Loại 1').length;
  const health2 = personnel.filter(p => p.health?.category === 'Loại 2').length;
  const health3 = personnel.filter(p => p.health?.category === 'Loại 3').length;
  const noHealthInfo = personnel.filter(p => !p.health?.category).length;

  const p1 = totalProfiles ? Math.round((health1 / totalProfiles) * 100) : 0;
  const p2 = totalProfiles ? Math.round((health2 / totalProfiles) * 100) : 0;
  const p3 = totalProfiles ? Math.round((health3 / totalProfiles) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Bảng Điều Khiển Tổng Quan</h1>
          <p className="text-gray-500 text-sm">Chào mừng bạn trở lại, đây là thống kê mới nhất hôm nay.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm shadow-sm">
            <Calendar size={14} />
            <span>11 Tháng 5, 2026</span>
          </div>
        </div>
      </div>

      <Row gutter={[20, 20]}>
        {stats.map((stat, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card className="shadow-sm hover:shadow-md transition-shadow border-none rounded-xl overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold mt-1 text-military-green">{stat.count}</p>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card 
            title={<span className="text-lg font-semibold">Phân bổ nguồn lực theo địa phương</span>} 
            className="shadow-sm border-none rounded-xl"
          >
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={localData}>
                  <defs>
                    <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2c3e2d" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2c3e2d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="qty" stroke="#2c3e2d" strokeWidth={3} fillOpacity={1} fill="url(#colorQty)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={<span className="text-lg font-semibold">Tình trạng sức khỏe</span>} 
            className="shadow-sm border-none rounded-xl h-full"
          >
            <div className="space-y-6 mt-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Loại 1 (Rất tốt)</span>
                  <span className="text-sm text-gray-500">{p1}% {totalProfiles > 0 && `(${health1})`}</span>
                </div>
                <Progress percent={p1} strokeColor="#2c3e2d" showInfo={false} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Loại 2 (Tốt)</span>
                  <span className="text-sm text-gray-500">{p2}% {totalProfiles > 0 && `(${health2})`}</span>
                </div>
                <Progress percent={p2} strokeColor="#c5a059" showInfo={false} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Loại 3 (Trung bình)</span>
                  <span className="text-sm text-gray-500">{p3}% {totalProfiles > 0 && `(${health3})`}</span>
                </div>
                <Progress percent={p3} strokeColor="#1a1a1a" showInfo={false} />
              </div>
              {noHealthInfo > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl flex items-center gap-3">
                  <ShieldAlert className="text-red-500" />
                  <div>
                    <p className="text-xs font-bold text-red-600">Lưu ý khám tuyển</p>
                    <p className="text-[10px] text-red-500">Còn {noHealthInfo} công dân chưa cập nhật kết quả khám sức khỏe.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24}>
          <Card 
            title={<span className="text-lg font-semibold">Cập nhật hồ sơ mới nhất</span>}
            className="shadow-sm border-none rounded-xl"
          >
            <Table 
              pagination={false}
              dataSource={recentData}
              columns={[
                { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName', render: (text) => <span className="font-semibold">{text}</span> },
                { title: 'Loại', dataIndex: 'type', key: 'type', render: (type) => (
                  <Tag color={type === 'QUAN_NHAN' ? 'green' : type === 'SI_QUAN_DU_BI' ? 'gold' : 'blue'}>
                    {type === 'QUAN_NHAN' ? 'Quân nhân' : type === 'SI_QUAN_DU_BI' ? 'Sĩ quan DB' : 'Công dân NVQS'}
                  </Tag>
                )},
                { title: 'Quân hàm/Cấp bậc', dataIndex: ['militaryInfo', 'rank'], key: 'rank', render: (text) => text || '---' },
                { title: 'Đơn vị', dataIndex: ['militaryInfo', 'unit'], key: 'unit' },
                { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (val) => val ? new Date(val).toLocaleDateString('vi-VN') : '---' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
