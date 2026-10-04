export type HabitFrequency = "DAILY" | "WEEKLY" | "REPEAT";
export type HabitRepeatUnit = "DAY" | "WEEK";

export const DEFAULT_HABITS = [
  {
    name: "25 минут оқу",
    description: "Күн сайын алаңдамай, бір фокус-сессия жаса.",
    icon: "BookOpen",
    sort_order: 10,
    frequency: "DAILY" as const,
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    goal: "Күн сайын 25 минут оқу",
    section: "Күндіз",
  },
  {
    name: "Күн жоспарын жазу",
    description: "Бүгінгі 3 маңызды істі алдын ала белгіле.",
    icon: "ListTodo",
    sort_order: 20,
    frequency: "DAILY" as const,
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    goal: "Күннің 3 маңызды ісін жазу",
    section: "Таңертең",
  },
  {
    name: "Телефонсыз 30 минут",
    description: "Оқу кезінде алаңдататын хабарламалардан үзіліс жаса.",
    icon: "Smartphone",
    sort_order: 30,
    frequency: "DAILY" as const,
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    goal: "30 минут фокус сақтау",
    section: "Күндіз",
  },
  {
    name: "Кітап оқу",
    description: "Кемі 10 бет оқып, ойыңды толықтыр.",
    icon: "Library",
    sort_order: 40,
    frequency: "DAILY" as const,
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    goal: "Кемі 10 бет оқу",
    section: "Кешке",
  },
  {
    name: "Күн соңын қорытындылау",
    description: "Бүгін не үйренгеніңді қысқаша жазып шық.",
    icon: "PenLine",
    sort_order: 50,
    frequency: "DAILY" as const,
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    goal: "Күнді 3 сөйлеммен қорытындылау",
    section: "Кешке",
  },
  {
    name: "Ұйқыға ерте дайындалу",
    description: "Ұйқы алдында экраннан үзіліс алып, тыныш режимге өт.",
    icon: "Moon",
    sort_order: 60,
    frequency: "DAILY" as const,
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    goal: "Ұйқыға уақытында дайындалу",
    section: "Кешке",
  },
] as const;

export const HABIT_ICONS = [
  "BookOpen",
  "ListTodo",
  "Smartphone",
  "Library",
  "PenLine",
  "Moon",
  "Dumbbell",
  "Sparkles",
] as const;

export function isAllowedHabitIcon(value: string) {
  return HABIT_ICONS.includes(value as (typeof HABIT_ICONS)[number]);
}

export function isHabitFrequency(value: unknown): value is HabitFrequency {
  return value === "DAILY" || value === "WEEKLY" || value === "REPEAT";
}

export function isHabitRepeatUnit(value: unknown): value is HabitRepeatUnit {
  return value === "DAY" || value === "WEEK";
}

export function cleanWeekdays(value: unknown) {
  if (!Array.isArray(value)) return null;

  const days = Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 1 && item <= 7),
    ),
  ).sort((a, b) => a - b);

  return days.length > 0 ? days : null;
}
