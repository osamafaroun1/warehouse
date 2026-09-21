export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain an uppercase letter' };
    if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain a lowercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain a number' };
    return { valid: true };
}

export function isRequired(value: string): boolean {
    return value.trim().length > 0;
}

export function isFutureDate(iso: string): boolean {
    return new Date(iso).getTime() > Date.now();
}

export function isPositiveNumber(value: number | string): boolean {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(n) && n > 0;
}
