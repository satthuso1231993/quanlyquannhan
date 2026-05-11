export type PersonnelType = "QUAN_NHAN" | "SI_QUAN_DU_BI" | "CONG_DAN_NVQS";

export interface Address {
  hometown: string;
  birthPlace: string;
  permanentResidence: string;
  currentResidence: string;
  ward: string;
  district: string;
  province: string;
}

export interface MilitaryInfo {
  enlistmentDate?: string;
  dischargeDate?: string;
  unit: string;
  position: string;
  rank: string;
  salaryGrade: string;
  salaryFactor: number;
  allowance: number;
  militarySpecialization: string;
  serviceStatus: string;
  mobilizationStatus: string;
  trainingStatus: string;
  socialInsuranceNumber: string;
  industryCardNumber: string;
}

export interface HealthInfo {
  category: string;
  history: string;
  chronicDiseases: string;
  deformities: string;
  vision: string;
  bloodPressure: string;
  lastCheckupDate: string;
}

export interface EducationInfo {
  culturalLevel: string;
  professionalLevel: string;
  politicalLevel: string;
  foreignLanguage: string;
  itLevel: string;
  trainingMajor: string;
  institution: string;
  graduationYear: number;
}

export interface FamilyMember {
  relation: string;
  fullName: string;
  birthYear: number;
  job: string;
  phone?: string;
}

export interface PersonnelProfile {
  id: string;
  fullName: string;
  alias?: string;
  birthDate: string;
  gender: "Nam" | "Nữ";
  idNumber: string;
  idIssueDate: string;
  idIssuePlace: string;
  ethnicity: string;
  religion: string;
  nationality: string;
  bloodType: string;
  height: number;
  weight: number;
  maritalStatus: string;
  phone: string;
  email: string;
  occupation: string;
  militaryCode: string;
  type: PersonnelType;
  address: Address;
  militaryInfo: MilitaryInfo;
  health: HealthInfo;
  education: EducationInfo;
  family: FamilyMember[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type UserRole = "ADMIN" | "COMMANDER" | "MANAGER" | "CLERK" | "VIEWER";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  unit: string;
}
