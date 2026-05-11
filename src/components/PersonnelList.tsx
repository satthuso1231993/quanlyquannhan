import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Space, Card, Dropdown, App as AntdApp, Modal, InputNumber } from 'antd';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit2, 
  Trash2, 
  FileDown, 
  UserPlus,
  QrCode
} from 'lucide-react';
import { collection, query, onSnapshot, doc, deleteDoc, db, handleFirestoreError, OperationType } from '../lib/localDb';
import { PersonnelService } from '../services/PersonnelService';
import { PersonnelProfile, PersonnelType } from '../types/military';
import { PersonnelForm } from './PersonnelForm';
import { QRCodeSVG } from 'qrcode.react';
import { format, differenceInYears } from 'date-fns';
import { useAuth } from '../context/AuthContext';

import { exportPersonnelToExcel } from '../lib/exportUtils';

export const PersonnelList: React.FC<{ type?: PersonnelType }> = ({ type }) => {
  const [data, setData] = useState<PersonnelProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [minAge, setMinAge] = useState<number | null>(null);
  const [maxAge, setMaxAge] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<PersonnelProfile | null>(null);
  const { appUser } = useAuth();
  const { message } = AntdApp.useApp();
  
  const canEdit = appUser?.role !== 'VIEWER';
  const isAdmin = appUser?.role === 'ADMIN' || appUser?.role === 'COMMANDER';

  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [unitFilter, setUnitFilter] = useState<string | null>(null);
  const [eduFilter, setEduFilter] = useState<string | null>(null);
  const [provinceFilter, setProvinceFilter] = useState<string | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);
  const [wardFilter, setWardFilter] = useState<string | null>(null);
  const [occupationFilter, setOccupationFilter] = useState<string | null>(null);
  const [religionFilter, setReligionFilter] = useState<string | null>(null);
  const [ethnicityFilter, setEthnicityFilter] = useState<string | null>(null);
  const [healthFilter, setHealthFilter] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<string | null>(null);

  const units = Array.from(new Set(data.map(p => p.militaryInfo?.unit).filter(Boolean)));
  const edus = Array.from(new Set(data.map(p => p.education?.professionalLevel).filter(Boolean)));
  const provinces = Array.from(new Set(data.map(p => p.address?.province).filter(Boolean)));
  const districts = Array.from(new Set(data.map(p => p.address?.district).filter(Boolean)));
  const wards = Array.from(new Set(data.map(p => p.address?.ward).filter(Boolean)));
  const occupations = Array.from(new Set(data.map(p => p.occupation).filter(Boolean)));
  const religions = Array.from(new Set(data.map(p => p.religion).filter(Boolean)));
  const ethnicities = Array.from(new Set(data.map(p => p.ethnicity).filter(Boolean)));
  const healthCategories = Array.from(new Set(data.map(p => p.health?.category).filter(Boolean)));

  const handleExportExcel = () => {
    if (data.length === 0) {
      message.warning('Không có dữ liệu để xuất');
      return;
    }
    exportPersonnelToExcel(data, `Danh_sach_${type || 'Nhan_su'}_${format(new Date(), 'ddMMyyyy')}.xlsx`);
  };

  const handleEdit = (record: PersonnelProfile) => {
    if (!canEdit) {
      message.error('Bạn không có quyền chỉnh sửa hồ sơ');
      return;
    }
    setEditingProfile(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (!isAdmin) {
      message.error('Chỉ cấp quản trị/chỉ huy mới có quyền xóa hồ sơ');
      return;
    }
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa hồ sơ của ${name}? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await PersonnelService.delete(id);
          message.success('Đã xóa hồ sơ thành công');
        } catch (error) {
          message.error('Không thể xóa hồ sơ');
        }
      }
    });
  };

  useEffect(() => {
    const q = collection(db, 'profiles');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonnelProfile));
      const filtered = type ? docs.filter(d => d.type === type) : docs;
      setData(filtered);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'profiles');
    });

    return unsubscribe;
  }, [type]);

  const columns = [
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text: string, record: PersonnelProfile) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
            {text.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{text}</div>
            <div className="text-[10px] text-gray-400 font-mono uppercase">{record.militaryCode || record.idNumber}</div>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'birthDate',
      key: 'birthDate',
      render: (date: string) => (
        <div>
          <span className="text-sm block">{date ? format(new Date(date), 'dd/MM/yyyy') : '-'}</span>
          {date && <span className="text-[10px] text-gray-500">{differenceInYears(new Date(), new Date(date))} tuổi</span>}
        </div>
      ),
    },
    {
      title: 'Đơn vị / Địa phương',
      dataIndex: ['militaryInfo', 'unit'],
      key: 'unit',
      render: (text: string, record: PersonnelProfile) => text || record.address?.province || '-',
    },
    {
      title: 'Cấp bậc / Chức vụ',
      key: 'rank_pos',
      render: (record: PersonnelProfile) => (
        <div className="text-xs">
          <div className="font-medium">{record.militaryInfo?.rank || '-'}</div>
          <div className="text-gray-500">{record.militaryInfo?.position || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Phân loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: PersonnelType) => (
        <Tag color={type === 'QUAN_NHAN' ? 'green' : type === 'SI_QUAN_DU_BI' ? 'gold' : 'blue'}>
          {type === 'QUAN_NHAN' ? 'Quân nhân' : type === 'SI_QUAN_DU_BI' ? 'Sĩ quan DB' : 'Công dân NVQS'}
        </Tag>
      ),
      filters: [
        { text: 'Quân nhân', value: 'QUAN_NHAN' },
        { text: 'Sĩ quan dự bị', value: 'SI_QUAN_DU_BI' },
        { text: 'Công dân NVQS', value: 'CONG_DAN_NVQS' },
      ],
      onFilter: (value: any, record: any) => record.type === value,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (record: PersonnelProfile) => (
        <Space size="middle">
          <Button icon={<Eye size={16} />} type="text" />
          {canEdit && <Button icon={<Edit2 size={16} />} type="text" onClick={() => handleEdit(record)} />}
          <Dropdown
            menu={{
              items: [
                { key: 'qr', label: 'Tạo mã QR', icon: <QrCode size={14} />, onClick: () => setSelectedQR(JSON.stringify({ id: record.id, name: record.fullName, code: record.militaryCode })) },
                { key: 'export', label: 'Xuất hồ sơ (PDF)', icon: <FileDown size={14} /> },
                ...(isAdmin ? [{ key: 'delete', label: 'Xóa hồ sơ', icon: <Trash2 size={14} />, danger: true, onClick: () => handleDelete(record.id, record.fullName) }] : []),
              ]
            }}
          >
            <Button icon={<MoreVertical size={16} />} type="text" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const filteredData = data.filter(p => {
    const matchesSearch = p.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
                          p.militaryCode?.toLowerCase().includes(searchText.toLowerCase()) ||
                          p.idNumber.includes(searchText);

    let age = 0;
    if (p.birthDate) {
      age = differenceInYears(new Date(), new Date(p.birthDate));
    }
    
    // If birthDate is missing but age filters are applied, exclude the record.
    const hasAge = !!p.birthDate;
    const matchesMinAge = minAge ? (hasAge && age >= minAge) : true;
    const matchesMaxAge = maxAge ? (hasAge && age <= maxAge) : true;
    
    const matchesUnit = unitFilter ? p.militaryInfo?.unit === unitFilter : true;
    const matchesEdu = eduFilter ? p.education?.professionalLevel === eduFilter : true;
    const matchesProvince = provinceFilter ? p.address?.province === provinceFilter : true;
    const matchesDistrict = districtFilter ? p.address?.district === districtFilter : true;
    const matchesWard = wardFilter ? p.address?.ward === wardFilter : true;
    const matchesOccupation = occupationFilter ? p.occupation === occupationFilter : true;
    const matchesReligion = religionFilter ? p.religion === religionFilter : true;
    const matchesEthnicity = ethnicityFilter ? p.ethnicity === ethnicityFilter : true;
    const matchesHealth = healthFilter ? p.health?.category === healthFilter : true;
    const matchesGender = genderFilter ? p.gender === genderFilter : true;

    return matchesSearch && matchesMinAge && matchesMaxAge && matchesUnit && matchesEdu && 
           matchesProvince && matchesDistrict && matchesWard && matchesOccupation && 
           matchesReligion && matchesEthnicity && matchesHealth && matchesGender;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Danh sách nhân sự {type === 'QUAN_NHAN' ? 'Quân nhân' : type === 'SI_QUAN_DU_BI' ? 'Sĩ quan dự bị' : type === 'CONG_DAN_NVQS' ? 'Công dân NVQS' : 'toàn hệ thống'}</h2>
          <p className="text-sm text-gray-500">Quản lý và tra cứu hồ sơ chi tiết.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button icon={<FileDown size={18} />} onClick={handleExportExcel}>Xuất Excel</Button>
        </div>
      </div>

      <Modal
        title={editingProfile ? `Chỉnh sửa hồ sơ: ${editingProfile.fullName}` : "Chi tiết hồ sơ"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
        centered
        destroyOnHidden
      >
        <PersonnelForm 
          initialData={editingProfile}
          onSuccess={() => setIsModalOpen(false)} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>

      <Modal
        title="Mã QR Hồ sơ"
        open={!!selectedQR}
        onCancel={() => setSelectedQR(null)}
        footer={null}
        width={300}
        centered
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <QRCodeSVG value={selectedQR || ''} size={200} />
          <p className="text-xs text-gray-500 text-center">Quét mã để truy cập nhanh hồ sơ trên thiết bị di động</p>
        </div>
      </Modal>

      <Card className="shadow-none border-gray-200">
        <div className="flex flex-wrap gap-4 mb-6">
          <Input 
            prefix={<Search size={16} className="text-gray-400" />} 
            placeholder="Tìm theo họ tên, mã quân nhân, CCCD..."
            className="max-w-md"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <Button 
            icon={<Filter size={18} />} 
            type={showAdvancedFilter ? 'primary' : 'default'}
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          >
            Lọc nâng cao
          </Button>
        </div>

        {showAdvancedFilter && (
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <Space>
              <span className="text-sm text-gray-500">Độ tuổi:</span>
              <InputNumber min={0} max={150} value={minAge} onChange={(val) => setMinAge(val)} placeholder="Từ" />
              <span>-</span>
              <InputNumber min={0} max={150} value={maxAge} onChange={(val) => setMaxAge(val)} placeholder="Đến" />
            </Space>
            
            <Select 
              placeholder="Đơn vị" 
              style={{ width: 180 }}
              allowClear
              value={unitFilter}
              onChange={setUnitFilter}
              options={units.map(u => ({ value: u, label: u }))}
            />
            
            <Select 
              placeholder="Trình độ" 
              style={{ width: 160 }}
              allowClear
              value={eduFilter}
              onChange={setEduFilter}
              options={edus.map(e => ({ value: e, label: e }))}
            />
            
            <Select 
              placeholder="Tỉnh / Thành phố" 
              style={{ width: 160 }}
              allowClear
              value={provinceFilter}
              onChange={setProvinceFilter}
              options={provinces.map(p => ({ value: p, label: p }))}
            />
            
            <Select 
              placeholder="Quận / Huyện" 
              style={{ width: 160 }}
              allowClear
              value={districtFilter}
              onChange={setDistrictFilter}
              options={districts.map(p => ({ value: p, label: p }))}
            />

            <Select 
              placeholder="Xã / Phường" 
              style={{ width: 160 }}
              allowClear
              value={wardFilter}
              onChange={setWardFilter}
              options={wards.map(p => ({ value: p, label: p }))}
            />

            <Select 
              placeholder="Nghề nghiệp" 
              style={{ width: 160 }}
              allowClear
              value={occupationFilter}
              onChange={setOccupationFilter}
              options={occupations.map(p => ({ value: p, label: p }))}
            />

            <Select 
              placeholder="Tôn giáo" 
              style={{ width: 120 }}
              allowClear
              value={religionFilter}
              onChange={setReligionFilter}
              options={religions.map(p => ({ value: p, label: p }))}
            />

            <Select 
              placeholder="Dân tộc" 
              style={{ width: 120 }}
              allowClear
              value={ethnicityFilter}
              onChange={setEthnicityFilter}
              options={ethnicities.map(p => ({ value: p, label: p }))}
            />

            <Select 
              placeholder="Sức khỏe" 
              style={{ width: 120 }}
              allowClear
              value={healthFilter}
              onChange={setHealthFilter}
              options={healthCategories.map(p => ({ value: p, label: p }))}
            />

            <Select 
              placeholder="Giới tính" 
              style={{ width: 120 }}
              allowClear
              value={genderFilter}
              onChange={setGenderFilter}
              options={[
                { value: 'Nam', label: 'Nam' },
                { value: 'Nữ', label: 'Nữ' },
              ]}
            />
            
            <Button 
              type="link" 
              onClick={() => {
                setMinAge(null); setMaxAge(null); setUnitFilter(null); setEduFilter(null); setProvinceFilter(null); setSearchText('');
                setDistrictFilter(null); setWardFilter(null); setOccupationFilter(null); setReligionFilter(null); setEthnicityFilter(null); setHealthFilter(null); setGenderFilter(null);
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}

        <Table 
          columns={columns} 
          dataSource={filteredData} 
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};
