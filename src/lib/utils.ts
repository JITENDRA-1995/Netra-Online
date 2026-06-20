import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getISTDateString = (d?: Date | string | number) => {
  const dateObj = d ? new Date(d) : new Date();
  if (isNaN(dateObj.getTime())) {
    const fallback = new Date();
    const offset = fallback.getTimezoneOffset() * 60000;
    return new Date(fallback.getTime() - offset).toISOString().split('T')[0];
  }
  const offset = dateObj.getTimezoneOffset() * 60000;
  return new Date(dateObj.getTime() - offset).toISOString().split('T')[0];
};

export const getISTDateTimeString = (d?: Date | string | number) => {
  const dateObj = d ? new Date(d) : new Date();
  if (isNaN(dateObj.getTime())) {
    const fallback = new Date();
    const offset = fallback.getTimezoneOffset() * 60000;
    // Replace the Z with +05:30 to be accurate for databases, or just strip the Z
    return new Date(fallback.getTime() - offset).toISOString().replace('Z', '+05:30');
  }
  const offset = dateObj.getTimezoneOffset() * 60000;
  return new Date(dateObj.getTime() - offset).toISOString().replace('Z', '+05:30');
};

export const extractDateFromInvoiceNo = (invNo?: string | null, fallbackDate?: string | number | Date | null) => {
  if (invNo) {
    const match = invNo.match(/(?:NG\/|CMS\/|INV-)?(\d{2})(\d{2})(\d{4})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
  }
  if (!fallbackDate) return getISTDateString();
  const parsedDate = new Date(fallbackDate);
  if (isNaN(parsedDate.getTime())) return getISTDateString();
  const offset = parsedDate.getTimezoneOffset() * 60000;
  return new Date(parsedDate.getTime() - offset).toISOString().split('T')[0];
};
