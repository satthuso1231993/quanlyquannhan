import * as XLSX from 'xlsx';

/**
 * Xuất dữ liệu nhân sự ra file Excel
 * @param data Mảng các đối tượng PersonnelProfile
 * @param fileName Tên file xuất ra (mặc định Personnel_Report.xlsx)
 */
export const exportPersonnelToExcel = (data: any[], fileName: string = 'VMS_Bao_Cao_Nhan_Su.xlsx') => {
  // Chuẩn bị dữ liệu phẳng để đưa vào thẻ Excel
  const flattenedData = data.map(item => ({
    'Mã định danh': item.id || '',
    'Họ và tên': item.fullName || '',
    'Loại đối tượng': item.type === 'QUAN_NHAN' ? 'Quân nhân' : item.type === 'SI_QUAN_DU_BI' ? 'Sĩ quan dự bị' : 'Công dân NVQS',
    'Ngày sinh': item.birthDate || '',
    'Số CCCD': item.idNumber || '',
    'Giới tính': item.gender || '',
    'Điện thoại': item.phone || '',
    'Email': item.email || '',
    'Mã số quân nhân': item.militaryCode || '',
    'Đơn vị': item.militaryInfo?.unit || '',
    'Cấp bậc': item.militaryInfo?.rank || '',
    'Chức vụ': item.militaryInfo?.position || '',
    'Quê quán': item.address?.hometown || '',
    'Thường trú': item.address?.permanentResidence || '',
    'Trình độ văn hóa': item.education?.culturalLevel || '',
    'Trình độ chuyên môn': item.education?.professionalLevel || '',
    'Chuyên ngành': item.education?.trainingMajor || '',
    'Sức khỏe': item.health?.category || '',
    'Ngày cập nhật': item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('vi-VN') : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(flattenedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Personnel');
  
  // Tạo file blob và tải xuống
  XLSX.writeFile(workbook, fileName);
};
