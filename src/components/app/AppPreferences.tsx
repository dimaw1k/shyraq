"use client";

import { useEffect } from "react";

const THEME_KEY = "shyraq:theme";

function resolveTheme(value: string | null) {
  if (value === "dark" || value === "light") return value;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppPreferences() {
  useEffect(() => {
    function applyTheme() {
      document.documentElement.dataset.theme = resolveTheme(window.localStorage.getItem(THEME_KEY));
    }

    applyTheme();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (window.localStorage.getItem(THEME_KEY) === "system") applyTheme();
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return null;
}
