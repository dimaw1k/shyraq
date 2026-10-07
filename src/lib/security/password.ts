const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "qwerty",
  "qwerty123",
  "12345678",
  "123456789",
  "1234567890",
  "11111111",
  "00000000",
  "admin123",
  "adminadmin",
  "welcome",
  "welcome123",
  "letmein",
  "iloveyou",
]);

function normalizeContextPart(value: string) {
  return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "");
}

export function getPasswordValidationError(
  password: string,
  context: string[] = [],
): string | null {
  if (password.length < 12) {
    return "Құпиясөз кемінде 12 таңбадан тұруы керек.";
  }

  if (password.length > 128) {
    return "Құпиясөз 128 таңбадан аспауы керек.";
  }

  if (!/[a-z]/.test(password)) {
    return "Құпиясөзде кемінде бір кіші әріп болуы керек.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Құпиясөзде кемінде бір бас әріп болуы керек.";
  }

  if (!/[0-9]/.test(password)) {
    return "Құпиясөзде кемінде бір сан болуы керек.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Құпиясөзде кемінде бір арнайы таңба болуы керек.";
  }

  const normalized = password.toLocaleLowerCase("en-US");

  if (COMMON_PASSWORDS.has(normalized)) {
    return "Бұл құпиясөз тым жиі қолданылатын немесе оңай болжанатын құпиясөз.";
  }

  if (/(.)\1\1/.test(password)) {
    return "Құпиясөзде бір таңба қатарынан 3 рет қайталанбауы керек.";
  }

  if (/(?:012345|123456|234567|345678|456789|567890|098765|987654|876543|765432|654321)/.test(normalized)) {
    return "Құпиясөзде ұзын сандық тізбек қолданбаңыз.";
  }

  if (/(?:qwerty|asdfgh|zxcvbn|password|admin|welcome|letmein)/.test(normalized)) {
    return "Құпиясөзде кең таралған шаблондарды қолданбаңыз.";
  }

  for (const item of context) {
    const normalizedContext = normalizeContextPart(item);
    if (normalizedContext.length >= 4 && normalized.includes(normalizedContext)) {
      return "Құпиясөз аты-жөн, email немесе телефон сияқты жеке деректерді қайталамауы керек.";
    }
  }

  return null;
}
