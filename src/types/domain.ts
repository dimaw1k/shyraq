export type AppRole = "STUDENT" | "MENTOR" | "CHIEF_MENTOR" | "LEADER";
export type ProfileStatus = "REGISTERED" | "WAITING_FOR_TEAM" | "ACTIVE" | "INACTIVE" | "COMPLETED";
export type EducationType = "SCHOOL" | "COLLEGE" | "UNIVERSITY" | "OTHER";

export type StudentLookupResult = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  education_type: EducationType;
  status: ProfileStatus;
  assigned_team_id: string | null;
};
