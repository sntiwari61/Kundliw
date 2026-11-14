/** The same shapes the server accepts, checked on the phone first so mistakes are caught without a round trip. */

/** A 10-digit Indian mobile number starting with 6 to 9. */
export function isValidPhone(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value.trim());
}

export function isValidOtp(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

/** Paise to a rupee label: 249900 -> "₹2,499", 265394 -> "₹2,653.94". */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export interface RegisterForm {
  name: string;
  phone: string;
  email: string;
  password: string;
  adult: boolean;
  associate: boolean;
}

/** The same rules as the website's sign-up form. Returns the text key of each faulty field. */
export function validateRegister(f: RegisterForm): Partial<Record<"name" | "phone" | "email" | "password" | "adult", string>> {
  const e: Partial<Record<"name" | "phone" | "email" | "password" | "adult", string>> = {};
  if (f.name.trim().length < 2) e.name = "errName";
  if (!isValidPhone(f.phone)) e.phone = "errPhone";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "errEmailAddr";
  if ((f.associate || f.password) && f.password.length < 8) e.password = "errPasswordShort";
  if (!f.adult) e.adult = "errAdult";
  return e;
}
