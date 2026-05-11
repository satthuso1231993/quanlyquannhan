import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  DatePicker, 
  Select, 
  InputNumber, 
  Row, 
  Col, 
  Divider, 
  Button, 
  App as AntdApp, 
  Card
} from 'antd';
import { 
  User, 
  MapPin, 
  Shield, 
  GraduationCap, 
  Activity, 
  Users as UsersIcon,
  CheckCircle2
} from 'lucide-react';
import { PersonnelService } from '../services/PersonnelService';
import { PersonnelProfile } from '../types/military';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

interface Props {
  initialData?: PersonnelProfile | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PersonnelForm: React.FC<Props> = ({ initialData, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { message } = AntdApp.useApp();
  const selectedType = Form.useWatch('type', form);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        birthDate: initialData.birthDate ? dayjs(initialData.birthDate) : undefined,
        idIssueDate: initialData.idIssueDate ? dayjs(initialData.idIssueDate) : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [initialData, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload: Partial<PersonnelProfile> = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.toISOString() : null,
        idIssueDate: values.idIssueDate ? values.idIssueDate.toISOString() : null,
        updatedAt: new Date().toISOString(),
      };

      if (initialData?.id) {
        await PersonnelService.save({ ...payload, id: initialData.id });
        message.success('Cập nhật hồ sơ thành công');
      } else {
        await PersonnelService.save({
          ...payload,
          createdAt: new Date().toISOString(),
          createdBy: appUser?.uid,
        });
        message.success('Thêm hồ sơ thành công');
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      message.error(initialData ? 'Lỗi khi cập nhật hồ sơ' : 'Lỗi khi thêm hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-none border-none">
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onFinish}
        initialValues={{ nationality: 'Việt Nam', type: 'QUAN_NHAN' }}
      >
        <div className="mb-6">
          <h3 className="flex items-center gap-2 font-bold mb-4 text-military-green border-b pb-2">
            <User size={18} /> Thông tin Cá nhân
          </h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true }]}>
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Loại đối tượng" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'QUAN_NHAN', label: 'Quân nhân' },
                    { value: 'SI_QUAN_DU_BI', label: 'Sĩ quan dự bị' },
                    { value: 'CONG_DAN_NVQS', label: 'Công dân NVQS' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="birthDate" label="Ngày sinh" rules={[{ required: true }]}>
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gender" label="Giới tính" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'Nam', label: 'Nam' },
                    { value: 'Nữ', label: 'Nữ' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="idNumber" label="Số CCCD" rules={[{ required: true }]}>
                <Input placeholder="12 số" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            {selectedType !== 'CONG_DAN_NVQS' && (
              <Col span={12}>
                <Form.Item name="militaryCode" label="Mã số quân nhân / SQDB">
                  <Input placeholder="QN-XXXX" />
                </Form.Item>
              </Col>
            )}
            <Col span={selectedType !== 'CONG_DAN_NVQS' ? 12 : 24}>
              <Form.Item name="phone" label="Số điện thoại">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="ethnicity" label="Dân tộc">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="religion" label="Tôn giáo">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="maritalStatus" label="Tình trạng hôn nhân">
                <Select options={[
                  { value: 'Độc thân', label: 'Độc thân' },
                  { value: 'Đã kết hôn', label: 'Đã kết hôn' },
                  { value: 'Ly hôn', label: 'Ly hôn' },
                  { value: 'Khác', label: 'Khác' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="occupation" label="Nghề nghiệp hiện nay">
                <Input placeholder="Lao động tự do, Công nhân, Kỹ sư..." />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div className="mb-6">
          <h3 className="flex items-center gap-2 font-bold mb-4 text-military-green border-b pb-2">
            <MapPin size={18} /> Địa chỉ liên hệ
          </h3>
          <Form.Item name={['address', 'hometown']} label="Quê quán">
            <Input />
          </Form.Item>
          <Form.Item name={['address', 'permanentResidence']} label="Hộ khẩu thường trú">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
             <Col span={8}><Form.Item name={['address', 'province']} label="Tỉnh/Thành"><Input /></Form.Item></Col>
             <Col span={8}><Form.Item name={['address', 'ward']} label="Xã/Phường"><Input /></Form.Item></Col>
             <Col span={8}><Form.Item name={['address', 'hamlet']} label="Khu phố/Thôn/Ấp"><Input /></Form.Item></Col>
          </Row>
        </div>

        <div className="mb-6">
          <h3 className="flex items-center gap-2 font-bold mb-4 text-military-green border-b pb-2">
            <UsersIcon size={18} /> Thông tin Gia đình & Thân nhân
          </h3>
          <Row gutter={16}>
            <Col span={12}><Form.Item name={['family', 'fatherName']} label="Họ tên Cha"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name={['family', 'fatherYear']} label="Năm sinh Cha"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name={['family', 'motherName']} label="Họ tên Mẹ"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name={['family', 'motherYear']} label="Năm sinh Mẹ"><Input /></Form.Item></Col>
          </Row>
          <Divider className="my-3" />
          <Row gutter={16}>
            <Col span={12}><Form.Item name={['family', 'spouseName']} label="Họ tên Vợ / Chồng"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name={['family', 'spouseYear']} label="Năm sinh Vợ / Chồng"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name={['family', 'children']} label="Thông tin con cái">
            <Input.TextArea rows={2} placeholder="Họ tên, năm sinh các con..." />
          </Form.Item>
          <Form.Item name={['family', 'policyInfo']} label="Chế độ chính sách / Hoàn cảnh">
            <Input.TextArea rows={2} placeholder="Hộ nghèo, gia đình chính sách, con thương binh..." />
          </Form.Item>
        </div>

        <div className="mb-6">
          <h3 className="flex items-center gap-2 font-bold mb-4 text-military-green border-b pb-2">
            <GraduationCap size={18} /> Trình độ Học vấn
          </h3>
          <Row gutter={16}>
            <Col span={12}><Form.Item name={['education', 'culturalLevel']} label="Trình độ văn hóa"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name={['education', 'professionalLevel']} label="Trình độ chuyên môn"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name={['education', 'politicalLevel']} label="Trình độ chính trị"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name={['education', 'trainingMajor']} label="Chuyên ngành đào tạo"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name={['education', 'institution']} label="Trường đào tạo"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name={['education', 'graduationYear']} label="Năm tốt nghiệp"><InputNumber className="w-full" /></Form.Item></Col>
          </Row>
        </div>

        {selectedType !== 'CONG_DAN_NVQS' && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 font-bold mb-4 text-military-green border-b pb-2">
              <Shield size={18} /> Thông tin Quân sự & Công tác
            </h3>
            <Row gutter={16}>
              <Col span={12}><Form.Item name={['militaryInfo', 'rank']} label="Cấp bậc quân hàm"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name={['militaryInfo', 'position']} label="Chức danh / Chức vụ"><Input /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item name={['militaryInfo', 'unit']} label="Đơn vị công tác / Đăng ký"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name={['militaryInfo', 'serviceStatus']} label="Tình trạng phục vụ"><Input /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item name={['militaryInfo', 'enlistmentDate']} label="Ngày nhập ngũ"><Input placeholder="dd/mm/yyyy" /></Form.Item></Col>
              <Col span={12}><Form.Item name={['militaryInfo', 'militarySpecialization']} label="Chuyên ngành quân sự"><Input /></Form.Item></Col>
            </Row>
            <Row gutter={32}>
              <Col span={8}><Form.Item name={['militaryInfo', 'salaryRank']} label="Bậc lương"><Input /></Form.Item></Col>
              <Col span={8}><Form.Item name={['militaryInfo', 'salaryFactor']} label="Hệ số lương"><Input /></Form.Item></Col>
              <Col span={8}><Form.Item name={['militaryInfo', 'allowance']} label="Phụ cấp"><Input /></Form.Item></Col>
            </Row>
            <Form.Item name={['militaryInfo', 'notes']} label="Ghi chú quá trình công tác">
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>
        )}

        <div className="mb-6">
          <h3 className="flex items-center gap-2 font-bold mb-4 text-military-green border-b pb-2">
            <Activity size={18} /> Thông tin Sức khỏe
          </h3>
          <Row gutter={16}>
            <Col span={12}><Form.Item name={['health', 'category']} label="Phân loại sức khỏe"><Input placeholder="Loại 1, 2, 3..." /></Form.Item></Col>
            <Col span={12}><Form.Item name={['health', 'bloodPressure']} label="Huyết áp"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name={['health', 'vision']} label="Thị lực"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name={['health', 'lastCheckupDate']} label="Ngày khám gần nhất"><Input placeholder="dd/mm/yyyy" /></Form.Item></Col>
          </Row>
          <Form.Item name={['health', 'chronicDiseases']} label="Bệnh nền / Tiền sử bệnh lý">
            <Input.TextArea rows={3} />
          </Form.Item>
        </div>

        <div className="mb-6">
          <Form.Item name="notes" label="Ghi chú chung">
            <Input.TextArea rows={3} placeholder="Ghi chú về hoàn cảnh, kỹ năng đặc biệt, hoặc thông tin khác..." />
          </Form.Item>

          <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm text-blue-700 flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5" />
            <span>Vui lòng kiểm tra kỹ tất cả thông tin trước khi nhấn Hoàn tất. Hồ sơ sẽ được lưu và bảo mật theo quy định.</span>
          </div>
        </div>

        <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
          <Button onClick={onCancel}>Hủy bỏ</Button>
          <Button type="primary" className="bg-military-green" loading={loading} htmlType="submit">
            Hoàn tất & Lưu hồ sơ
          </Button>
        </div>
      </Form>
    </Card>
  );
};

