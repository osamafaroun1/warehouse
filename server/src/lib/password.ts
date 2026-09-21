/**
 * Password hashing using bcrypt.
 *
 * Cost factor 12 is a reasonable baseline for server-side hashing in 2026 —
 * bumped if your hardware allows the ~250-500ms target hash time without
 * degrading login UX. Re-tune based on your actual prod boxes.
 */

import bcrypt from 'bcryptjs';

const CURRENT_COST_FACTOR = 12;

export async function hashPassword(plaintext: string): Promise<string> {
    if (plaintext.length < 8) {
        throw new Error('Password must be at least 8 characters');
    }
    return await bcrypt.hash(plaintext, CURRENT_COST_FACTOR);
}

export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
    try {
        return await bcrypt.compare(plaintext, hash);
    } catch {
        return false;
    }
}

/**
 * Returns true if the hash was created with a lower cost factor than
 * CURRENT_COST_FACTOR and should be re-hashed on next successful login.
 *
 * Bcrypt hashes encode their cost factor directly in the string, e.g.:
 *   $2a$12$abcdefghijklmnopqrstuv...
 *          ^^ cost factor
 */
export function needsRehash(hash: string): boolean {
    try {
        const parts = hash.split('$');
        // Bcrypt hashes always follow the format $<algorithm>$<cost>$<salt+hash>
        // parts: ["", "2a", "12", "restofhash..."]
        const cost = Number(parts[2]);
        if (!Number.isInteger(cost)) return true;
        return cost < CURRENT_COST_FACTOR;
    } catch {
        return true;
    }
}

// TODO
// Bcrypt hashes always follow the format $<algorithm>$<cost>$<salt+hash> — the cost factor is right there as plain text,
// so comparing it against your current target (CURRENT_COST_FACTOR) tells you if an old hash was made with a weaker setting
// If parsing fails for any reason (malformed hash, unexpected format), it defaults to true (needs rehash) —
// same fail-safe behavior as your original argon2 version, erring on the side of upgrading rather than silently leaving a weak hash in place

// How you'd use this in your login flow (if not already wired up)
// tsconst isValid = await verifyPassword(user.passwordHash, submittedPassword);

// if (isValid && needsRehash(user.passwordHash)) {
//   const newHash = await hashPassword(submittedPassword);
//   await updateUserPasswordHash(user.id, newHash); // your own update call
// }
