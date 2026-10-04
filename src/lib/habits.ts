export const DEFAULT_HABITS = [
  {
    name: "25 минут оқу",
    description: "Күн сайын алаңдамай, бір фокус-сессия жаса.",
    icon: "BookOpen",
    sort_order: 10,
  },
  {
    name: "Күн жоспарын жазу",
    description: "Бүгінгі 3 маңызды істі алдын ала белгіле.",
    icon: "ListTodo",
    sort_order: 20,
  },
  {
    name: "Телефонсыз 30 минут",
    description: "Оқу кезінде алаңдататын хабарламалардан үзіліс жаса.",
    icon: "SmartphoneOff",
    sort_order: 30,
  },
  {
    name: "Кітап оқу",
    description: "Кемі 10 бет оқып, ойыңды толықтыр.",
    icon: "Library",
    sort_order: 40,
  },
  {
    name: "Күн соңын қорытындылау",
    description: "Бүгін не үйренгеніңді қысқаша жазып шық.",
    icon: "PenLine",
    sort_order: 50,
  },
  {
    name: "Ұйқыға ерте дайындалу",
    description: "Ұйқы алдында экраннан үзіліс алып, тыныш режимге өт.",
    icon: "Moon",
    sort_order: 60,
  },
] as const;

export const HABIT_ICONS = [
  "BookOpen",
  "ListTodo",
  "SmartphoneOff",
  "Library",
  "PenLine",
  "Moon",
  "Dumbbell",
  "Sparkles",
] as const;

export function isAllowedHabitIcon(value: string) {
  return HABIT_ICONS.includes(value as (typeof HABIT_ICONS)[number]);
}
