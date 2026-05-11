import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Button, Table, Tag } from 'antd';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { collection, query, onSnapshot, db } from '../lib/localDb';
import { PersonnelProfile } from '../types/military';
import { FileDown, Filter, Printer } from 'lucide-react';

const COLORS = ['#2c3e2d', '#c5a059', '#1a1a1a', '#4a5d4b', '#d4af37'];

import { exportPersonnelToExcel } from '../lib/exportUtils';
import { format } from 'date-fns';

export const ReportsView: React.FC = () => {
  const [data, setData] = useState<PersonnelProfile[]>([]);
  const [filteredData, setFilteredData] = useState<PersonnelProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for filters
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [unitFilter, setUnitFilter] = useState<string | null>(null);
  const [provinceFilter, setProvinceFilter] = useState<string | null>(null);
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const [healthFilter, setHealthFilter] = useState<string | null>(null);
  const [eduFilter, setEduFilter] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<string | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);
  const [communeFilter, setCommuneFilter] = useState<string | null>(null);
  const [majorFilter, setMajorFilter] = useState<string | null>(null);
  const [occupationFilter, setOccupationFilter] = useState<string | null>(null);
  const [milSpecFilter, setMilSpecFilter] = useState<string | null>(null);
  const [maritalFilter, setMaritalFilter] = useState<string | null>(null);
  const [ethnicityFilter, setEthnicityFilter] = useState<string | null>(null);
  const [religionFilter, setReligionFilter] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState<string | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<string | null>(null);
  const [ageRangeFilter, setAgeRangeFilter] = useState<string | null>(null);

  const calculateAge = (birthDateStr: string) => {
    if (!birthDateStr) return null;
    try {
      const parts = birthDateStr.split('/');
      const birthDate = parts.length === 3 
        ? new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
        : new Date(birthDateStr);
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return null;
    }
  };

  const checkAgeRange = (age: number, range: string) => {
    if (range === '<18') return age < 18;
    if (range === '18-25') return age >= 18 && age <= 25;
    if (range === '26-35') return age >= 26 && age <= 35;
    if (range === '36-45') return age >= 36 && age <= 45;
    if (range === '46-55') return age >= 46 && age <= 55;
    if (range === '>55') return age > 55;
    return true;
  };

  const handleExport = () => {
    exportPersonnelToExcel(filteredData, `Bao_cao_thong_ke_${format(new Date(), 'ddMMyyyy')}.xlsx`);
  };

  useEffect(() => {
    const q = collection(db, 'profiles');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonnelProfile));
      setData(rawData);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let result = [...data];
    if (typeFilter) result = result.filter(p => p.type === typeFilter);
    if (unitFilter) result = result.filter(p => p.militaryInfo?.unit === unitFilter);
    if (provinceFilter) result = result.filter(p => p.address?.province === provinceFilter);
    if (rankFilter) result = result.filter(p => p.militaryInfo?.rank === rankFilter);
    if (healthFilter) result = result.filter(p => p.health?.category === healthFilter);
    if (eduFilter) result = result.filter(p => p.education?.professionalLevel === eduFilter);
    if (genderFilter) result = result.filter(p => p.gender === genderFilter);
    if (districtFilter) result = result.filter(p => p.address?.ward === districtFilter);
    if (communeFilter) result = result.filter(p => p.address?.hamlet === communeFilter);
    if (majorFilter) result = result.filter(p => p.education?.trainingMajor === majorFilter);
    if (occupationFilter) result = result.filter(p => p.occupation === occupationFilter);
    if (milSpecFilter) result = result.filter(p => p.militaryInfo?.militarySpecialization === milSpecFilter);
    if (maritalFilter) result = result.filter(p => p.maritalStatus === maritalFilter);
    if (ethnicityFilter) result = result.filter(p => p.ethnicity === ethnicityFilter);
    if (religionFilter) result = result.filter(p => p.religion === religionFilter);
    if (positionFilter) result = result.filter(p => p.militaryInfo?.position === positionFilter);
    if (dateRangeFilter) {
      const today = new Date();
      result = result.filter(p => {
        if (!p.updatedAt) return false;
        const updateDate = new Date(p.updatedAt);
        const diffDays = Math.floor((today.getTime() - updateDate.getTime()) / (1000 * 3600 * 24));
        if (dateRangeFilter === 'today') return diffDays === 0;
        if (dateRangeFilter === 'week') return diffDays <= 7;
        if (dateRangeFilter === 'month') return diffDays <= 30;
        return true;
      });
    }
    if (ageRangeFilter) {
      result = result.filter(p => {
        const age = calculateAge(p.birthDate);
        return age !== null && checkAgeRange(age, ageRangeFilter);
      });
    }
    setFilteredData(result);
  }, [data, typeFilter, unitFilter, provinceFilter, rankFilter, healthFilter, eduFilter, genderFilter, districtFilter, communeFilter, majorFilter, occupationFilter, milSpecFilter, ageRangeFilter]);

  // Options for filters
  const units = Array.from(new Set(data.map(p => p.militaryInfo?.unit).filter(Boolean)));
  const provinces = Array.from(new Set(data.map(p => p.address?.province).filter(Boolean)));
  const districts = Array.from(new Set(data.map(p => p.address?.ward).filter(Boolean)));
  const communes = Array.from(new Set(data.map(p => p.address?.hamlet).filter(Boolean)));
  const majors = Array.from(new Set(data.map(p => p.education?.trainingMajor).filter(Boolean)));
  const occupations = Array.from(new Set(data.map(p => p.occupation).filter(Boolean)));
  const milSpecs = Array.from(new Set(data.map(p => p.militaryInfo?.militarySpecialization).filter(Boolean)));
  const ranks = Array.from(new Set(data.map(p => p.militaryInfo?.rank).filter(Boolean)));
  const healths = Array.from(new Set(data.map(p => p.health?.category).filter(Boolean)));
  const edus = Array.from(new Set(data.map(p => p.education?.professionalLevel).filter(Boolean)));
  const ethnicities = Array.from(new Set(data.map(p => p.ethnicity).filter(Boolean)));
  const religions = Array.from(new Set(data.map(p => p.religion).filter(Boolean)));
  const positions = Array.from(new Set(data.map(p => p.militaryInfo?.position).filter(Boolean)));
  const maritals = Array.from(new Set(data.map(p => p.maritalStatus).filter(Boolean)));

  // Thống kê theo loại (Dùng filteredData)
  const typeStats = [
    { name: 'Quân nhân', value: filteredData.filter(p => p.type === 'QUAN_NHAN').length },
    { name: 'Sĩ quan dự bị', value: filteredData.filter(p => p.type === 'SI_QUAN_DU_BI').length },
    { name: 'Công dân NVQS', value: filteredData.filter(p => p.type === 'CONG_DAN_NVQS').length },
  ];

  // Thống kê theo địa phương (Tỉnh)
  const provinceMap = new Map();
  filteredData.forEach(p => {
    const province = p.address?.province || 'Chưa xác định';
    provinceMap.set(province, (provinceMap.get(province) || 0) + 1);
  });
  const provinceStats = Array.from(provinceMap.entries()).map(([name, value]) => ({ name, value }));

  // Thống kê theo trình độ
  const eduMap = new Map();
  filteredData.forEach(p => {
    const level = p.education?.professionalLevel || 'Chưa xác định';
    eduMap.set(level, (eduMap.get(level) || 0) + 1);
  });
  const eduStats = Array.from(eduMap.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hệ thống Báo cáo & Thống kê</h1>
          <p className="text-sm text-gray-500">Phân tích dữ liệu tổng lực lượng và nguồn dự bị.</p>
        </div>
        <div className="flex gap-2">
          <Button icon={<Printer size={18} />}>In báo cáo</Button>
          <Button 
            type="primary" 
            className="bg-military-green flex items-center gap-2" 
            icon={<FileDown size={18} />}
            onClick={handleExport}
          >
            Xuất Excel Thống kê
          </Button>
        </div>
      </div>

      <Card className="rounded-xl border-none shadow-sm pb-2">
        <div className="flex items-center gap-2 mb-4 text-military-green font-bold">
          <Filter size={18} />
          <span>Bộ lọc thống kê</span>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Loại đối tượng</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả các loại" 
              allowClear
              onChange={setTypeFilter}
              options={[
                { value: 'QUAN_NHAN', label: 'Quân nhân' },
                { value: 'SI_QUAN_DU_BI', label: 'Sĩ quan dự bị' },
                { value: 'CONG_DAN_NVQS', label: 'Công dân NVQS' },
              ]} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Đơn vị công tác</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả các đơn vị" 
              allowClear
              onChange={setUnitFilter}
              options={units.map(u => ({ value: u, label: u }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Tỉnh / Thành phố</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả địa phương" 
              allowClear
              onChange={setProvinceFilter}
              options={provinces.map(p => ({ value: p, label: p }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Cấp bậc quân hàm</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả cấp bậc" 
              allowClear
              onChange={setRankFilter}
              options={ranks.map(r => ({ value: r, label: r }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Sức khỏe</div>
            <Select 
              className="w-full" 
              placeholder="Xếp loại sức khỏe" 
              allowClear
              onChange={setHealthFilter}
              options={healths.map(h => ({ value: h, label: h }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Trình độ chuyên môn</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả trình độ" 
              allowClear
              onChange={setEduFilter}
              options={edus.map(e => ({ value: e, label: e }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Giới tính</div>
            <Select 
              className="w-full" 
              placeholder="Lọc theo giới tính" 
              allowClear
              onChange={setGenderFilter}
              options={[
                { value: 'Nam', label: 'Nam' },
                { value: 'Nữ', label: 'Nữ' },
                { value: 'Khác', label: 'Khác' },
              ]} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Xã / Phường</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả xã/phường" 
              allowClear
              onChange={setDistrictFilter}
              options={districts.map(d => ({ value: d, label: d }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Khu phố / Thôn</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả khu phố/thôn" 
              allowClear
              onChange={setCommuneFilter}
              options={communes.map(c => ({ value: c, label: c }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Chuyên ngành</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả chuyên ngành" 
              allowClear
              onChange={setMajorFilter}
              options={majors.map(m => ({ value: m, label: m }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Nghề nghiệp</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả nghề nghiệp" 
              allowClear
              onChange={setOccupationFilter}
              options={occupations.map(o => ({ value: o, label: o }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Chuyên ngành quân sự</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả chuyên ngành" 
              allowClear
              onChange={setMilSpecFilter}
              options={milSpecs.map(m => ({ value: m, label: m }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Chức vụ</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả chức vụ" 
              allowClear
              onChange={setPositionFilter}
              options={positions.map(p => ({ value: p, label: p }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Dân tộc</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả dân tộc" 
              allowClear
              onChange={setEthnicityFilter}
              options={ethnicities.map(e => ({ value: e, label: e }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Tôn giáo</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả tôn giáo" 
              allowClear
              onChange={setReligionFilter}
              options={religions.map(r => ({ value: r, label: r }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Tình trạng hôn nhân</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả" 
              allowClear
              onChange={setMaritalFilter}
              options={maritals.map(m => ({ value: m, label: m }))} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Thời gian cập nhật</div>
            <Select 
              className="w-full" 
              placeholder="Tất cả thời gian" 
              allowClear
              onChange={setDateRangeFilter}
              options={[
                { value: 'today', label: 'Hôm nay' },
                { value: 'week', label: '7 ngày qua' },
                { value: 'month', label: '30 ngày qua' },
              ]} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-500 mb-1">Độ tuổi</div>
            <Select 
              className="w-full" 
              placeholder="Lọc theo độ tuổi" 
              allowClear
              onChange={setAgeRangeFilter}
              options={[
                { value: '<18', label: 'Dưới 18 tuổi' },
                { value: '18-25', label: 'Từ 18 - 25' },
                { value: '26-35', label: 'Từ 26 - 35' },
                { value: '36-45', label: 'Từ 36 - 45' },
                { value: '46-55', label: 'Từ 46 - 55' },
                { value: '>55', label: 'Trên 55 tuổi' },
              ]} 
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card title="Cơ cấu lực lượng (Theo bộ lọc)" className="rounded-xl border-none shadow-sm">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Phân bổ theo địa phương" className="rounded-xl border-none shadow-sm">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={provinceStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2c3e2d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Thống kê nhân sự theo trình độ chuyên môn" className="rounded-xl border-none shadow-sm">
            <Table 
              pagination={false}
              dataSource={eduStats}
              columns={[
                { title: 'Trình độ', dataIndex: 'name', key: 'name' },
                { title: 'Số lượng', dataIndex: 'value', key: 'value', sorter: (a, b) => a.value - b.value },
                { title: 'Tỷ lệ (%)', key: 'percent', render: (record) => (
                  <span>{((record.value / (filteredData.length || 1)) * 100).toFixed(1)}%</span>
                )},
                { title: 'Biểu đồ', key: 'bar', render: (record) => (
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-military-green h-full" 
                      style={{ width: `${(record.value / (filteredData.length || 1)) * 100}%` }}
                    />
                  </div>
                )}
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
