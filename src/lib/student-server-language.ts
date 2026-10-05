import { cookies } from "next/headers";
import { studentText, type StudentLanguage } from "@/lib/student-translations";

export async function getStudentLanguage(): Promise<StudentLanguage> {
  const store = await cookies();
  const value = store.get("shyraq-language")?.value;
  return value === "ru" || value === "en" ? value : "kk";
}

export async function getStudentTranslator() {
  const language = await getStudentLanguage();
  return {
    language,
    t: (key: string) => studentText(language, key),
  };
}
