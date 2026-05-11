import React, { useState } from 'react';
import { Card, Typography } from 'antd';
import { UserPlus } from 'lucide-react';
import { PersonnelForm } from './PersonnelForm';

const { Title, Text } = Typography;

export const PersonnelEntryView: React.FC = () => {
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title level={4} className="!mb-1">Nhập Thông Tin Hồ Sơ</Title>
          <Text type="secondary">
            Thêm mới hồ sơ (Quân nhân, Sĩ quan dự bị, hoặc Công dân NVQS) vào cơ sở dữ liệu.
          </Text>
        </div>
      </div>
      
      <Card className="shadow-sm border-gray-100">
        <PersonnelForm 
          key={formKey}
          onSuccess={() => {
            setFormKey(prev => prev + 1); // Remount to clear the form
          }} 
          onCancel={() => {
            setFormKey(prev => prev + 1);
          }}
        />
      </Card>
    </div>
  );
};
