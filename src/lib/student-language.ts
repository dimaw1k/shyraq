"use client";

import { useEffect, useState } from "react";

export type StudentLanguage = "kk" | "ru" | "en";

export const STUDENT_LANGUAGE_KEY = "shyraq:language";
export const STUDENT_LANGUAGE_EVENT = "shyraq-language-change";

export const studentTranslations: Record<StudentLanguage, Record<string, string>> = {
  kk: {
    settings: "Баптаулар",
    language: "Тіл",
    reminders: "Еске салғыштар",
    appearance: "Көрініс",
    security: "Қауіпсіздік",
    account: "Аккаунт",
    about: "Қолданба туралы",
    feedback: "Кері байланыс",
    kazakh: "Қазақша",
    russian: "Русский",
    english: "English",
    light: "Жарық",
    dark: "Күңгірт",
    system: "Жүйе",
    enabled: "Қосулы",
    disabled: "Өшірулі",
    save: "Сақтау",
    saved: "Сақталды",
    saveFailed: "Сақталмады",
    morningMeet: "Таңғы Meet",
    morningReport: "Таңғы есеп",
    eveningMeet: "Кешкі Meet",
    eveningReport: "Кешкі есеп",
    habits: "Әдеттер",
    browserNotifications: "Хабарландырулар",
    allowNotifications: "Рұқсат беру",
    notificationsOn: "Хабарландырулар қосулы",
    testNotification: "Тексеру",
    password: "Құпиясөз",
    changePassword: "Құпиясөзді өзгерту",
    profile: "Профиль",
    logout: "Шығу",
    email: "Электрондық пошта",
    version: "Нұсқа",
    platform: "Платформа",
    sendFeedback: "Жіберу",
    feedbackCategory: "Санат",
    feedbackMessage: "Хабарлама",
    technical: "Техникалық қате",
    suggestion: "Ұсыныс",
    other: "Басқа",
    feedbackSent: "Жіберілді",
    enterMessage: "Хабарламаңызды жазыңыз",
    appName: "Shyraq Education",
    support: "Қолдау",
    notificationDenied: "Хабарландыруға рұқсат берілмеді",
    notificationUnsupported: "Бұл браузер хабарландыруды қолдамайды",
    allDevices: "Барлық құрылғылардан шығу",
    reminderCount: "қосулы",
  },
  ru: {
    settings: "Настройки",
    language: "Язык",
    reminders: "Напоминания",
    appearance: "Вид",
    security: "Безопасность",
    account: "Аккаунт",
    about: "О приложении",
    feedback: "Обратная связь",
    kazakh: "Қазақша",
    russian: "Русский",
    english: "English",
    light: "Светлая",
    dark: "Тёмная",
    system: "Системная",
    enabled: "Включено",
    disabled: "Выключено",
    save: "Сохранить",
    saved: "Сохранено",
    saveFailed: "Не сохранено",
    morningMeet: "Утренний Meet",
    morningReport: "Утренний отчёт",
    eveningMeet: "Вечерний Meet",
    eveningReport: "Вечерний отчёт",
    habits: "Привычки",
    browserNotifications: "Уведомления",
    allowNotifications: "Разрешить",
    notificationsOn: "Уведомления включены",
    testNotification: "Проверить",
    password: "Пароль",
    changePassword: "Изменить пароль",
    profile: "Профиль",
    logout: "Выйти",
    email: "Электронная почта",
    version: "Версия",
    platform: "Платформа",
    sendFeedback: "Отправить",
    feedbackCategory: "Категория",
    feedbackMessage: "Сообщение",
    technical: "Техническая ошибка",
    suggestion: "Предложение",
    other: "Другое",
    feedbackSent: "Отправлено",
    enterMessage: "Напишите сообщение",
    appName: "Shyraq Education",
    support: "Поддержка",
    notificationDenied: "Доступ к уведомлениям запрещён",
    notificationUnsupported: "Браузер не поддерживает уведомления",
    allDevices: "Выйти со всех устройств",
    reminderCount: "включено",
  },
  en: {
    settings: "Settings",
    language: "Language",
    reminders: "Reminders",
    appearance: "Appearance",
    security: "Security",
    account: "Account",
    about: "About",
    feedback: "Feedback",
    kazakh: "Қазақша",
    russian: "Русский",
    english: "English",
    light: "Light",
    dark: "Dark",
    system: "System",
    enabled: "On",
    disabled: "Off",
    save: "Save",
    saved: "Saved",
    saveFailed: "Not saved",
    morningMeet: "Morning Meet",
    morningReport: "Morning report",
    eveningMeet: "Evening Meet",
    eveningReport: "Evening report",
    habits: "Habits",
    browserNotifications: "Notifications",
    allowNotifications: "Allow",
    notificationsOn: "Notifications on",
    testNotification: "Test",
    password: "Password",
    changePassword: "Change password",
    profile: "Profile",
    logout: "Log out",
    email: "Email",
    version: "Version",
    platform: "Platform",
    sendFeedback: "Send",
    feedbackCategory: "Category",
    feedbackMessage: "Message",
    technical: "Technical issue",
    suggestion: "Suggestion",
    other: "Other",
    feedbackSent: "Sent",
    enterMessage: "Write a message",
    appName: "Shyraq Education",
    support: "Support",
    notificationDenied: "Notification permission denied",
    notificationUnsupported: "This browser does not support notifications",
    allDevices: "Sign out from all devices",
    reminderCount: "enabled",
  },
};

function readStoredLanguage(): StudentLanguage {
  if (typeof window === "undefined") return "kk";
  const value = window.localStorage.getItem(STUDENT_LANGUAGE_KEY);
  return value === "ru" || value === "en" ? value : "kk";
}

export function setStudentLanguage(language: StudentLanguage) {
  window.localStorage.setItem(STUDENT_LANGUAGE_KEY, language);
  window.dispatchEvent(new CustomEvent(STUDENT_LANGUAGE_EVENT, { detail: language }));
  document.documentElement.lang = language;
}

export function useStudentLanguage() {
  const [language, setLanguage] = useState<StudentLanguage>(readStoredLanguage);

  useEffect(() => {
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<StudentLanguage>).detail;
      if (next === "kk" || next === "ru" || next === "en") setLanguage(next);
    };

    window.addEventListener(STUDENT_LANGUAGE_EVENT, onChange);
    return () => window.removeEventListener(STUDENT_LANGUAGE_EVENT, onChange);
  }, []);

  return {
    language,
    t: (key: string) => studentTranslations[language][key] ?? studentTranslations.kk[key] ?? key,
  };
}
