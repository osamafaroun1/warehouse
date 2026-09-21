import z from 'zod';
import { DbClient } from '../db/client';
import { UserRole } from '../db/schema';
import { usersCreateInputSchema, usersUpdateSchema } from '../db/schemaValidation';
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../lib/errors';
import { hashPassword, verifyPassword } from '../lib/password';
import { UserModel } from '../models/user.model';
import { AuditInfo, BaseService } from './base.service';

type SafeUser<T extends { passwordHash?: string }> = Omit<T, 'passwordHash'>;

export class UserService extends BaseService {
    private repository: UserModel;
    private requesterRole?: UserRole;

    constructor(db: DbClient, userId?: string, requesterRole?: UserRole) {
        super(db, userId);
        this.repository = new UserModel(db);
        this.requesterRole = requesterRole;
    }

    // ... (assertCanModifyTarget, sanitize, sanitizeAll unchanged)

    private assertCanModifyTarget(target: { role?: unknown }) {
        if (target.role === 'owner' && this.requesterRole !== 'owner') {
            throw new ForbiddenError('Only an owner can modify or remove another owner');
        }
    }

    private sanitize<T extends { passwordHash?: string }>(user: T): SafeUser<T> {
        const { passwordHash, ...rest } = user;
        return rest;
    }

    private sanitizeAll<T extends { passwordHash?: string }>(users: T[]): SafeUser<T>[] {
        return users.map((u) => this.sanitize(u));
    }

    // === CRUD ===

    async createUser(input: z.infer<typeof usersCreateInputSchema>) {
        const existingEmail = await this.repository.getByEmail(input.email);
        if (existingEmail) throw new ConflictError('Email already exists');
        const existingUsername = await this.repository.getByUsername(input.username);
        if (existingUsername) throw new ConflictError('Username already exists');

        const { password, ...rest } = input;
        const passwordHash = await hashPassword(password);
        const user = await this.repository.create({ ...rest, passwordHash });

        // const auditInfo: AuditInfo = {
        //     id: user.id,
        //     label: `${user.firstName} ${user.lastName}`.trim() || user.username || user.id,
        //     path: `/user/${user.id}`,
        // };
        // await this.logCreated('users', user.id, auditInfo);

        return this.sanitize(user);
    }

    async getUserById(id: string) {
        const user = await this.repository.findById(id);
        if (!user) throw new NotFoundError('User not found');
        return this.sanitize(user);
    }

    async getUserByEmail(email: string) {
        const user = await this.repository.getByEmail(email);
        if (!user) throw new NotFoundError('User not found');
        return this.sanitize(user);
    }

    async getUserByUsername(username: string) {
        const user = await this.repository.getByUsername(username);
        if (!user) throw new NotFoundError('User not found');
        return this.sanitize(user);
    }

    async listUsers() {
        return this.sanitizeAll(await this.repository.getUsers());
    }

    async getUsersByRole(role: UserRole) {
        return this.sanitizeAll(await this.repository.getByRole(role));
    }

    async getActiveUsers() {
        return this.sanitizeAll(await this.repository.getActiveUsers());
    }

    async searchUsers(query: string, pagination: { limit?: number; offset?: number } = {}) {
        if (query.length < 2) throw new Error('Search query must be at least 2 characters');
        return this.sanitizeAll(await this.repository.search(query, pagination.limit, pagination.offset));
    }

    async updateUser(id: string, input: z.infer<typeof usersUpdateSchema> | Record<string, unknown>) {
        const existing = await this.repository.findById(id);
        if (!existing) throw new NotFoundError('User not found');
        this.assertCanModifyTarget(existing);

        if (input.role && input.role !== existing.role && input.role === 'owner' && this.requesterRole !== 'owner') {
            throw new ForbiddenError('Only an owner can grant the owner role');
        }
        if (input.email) {
            const userWithEmail = await this.repository.getByEmail(input.email as string);
            if (userWithEmail && userWithEmail.id !== id) {
                throw new ConflictError('Email already exists');
            }
        }
        if (input.username) {
            const userWithUsername = await this.repository.getByUsername(input.username as string);
            if (userWithUsername && userWithUsername.id !== id) {
                throw new ConflictError('Username already exists');
            }
        }

        const updated = await this.repository.update(id, input);

        // const auditInfo: AuditInfo = {
        //     id: updated.id,
        //     label: `${updated.firstName} ${updated.lastName}`.trim() || updated.username || updated.id,
        //     path: `/user/${updated.id}`,
        // };
        // await this.logUpdated('users', id, existing, updated, auditInfo);

        return this.sanitize(updated);
    }

    async activateUser(id: string) {
        const existing = await this.repository.findById(id);
        if (!existing) throw new NotFoundError('User not found');
        this.assertCanModifyTarget(existing);
        const updated = await this.repository.update(id, { isActive: true });

        // const auditInfo: AuditInfo = {
        //     id: updated.id,
        //     label: `${updated.firstName} ${updated.lastName}`.trim() || updated.username || updated.id,
        //     path: `/user/${updated.id}`,
        // };
        // await this.logUpdated('users', id, existing, updated, auditInfo);

        return this.sanitize(updated);
    }

    async deactivateUser(id: string) {
        const existing = await this.repository.findById(id);
        if (!existing) throw new NotFoundError('User not found');
        this.assertCanModifyTarget(existing);
        const updated = await this.repository.update(id, { isActive: false });

        // const auditInfo: AuditInfo = {
        //     id: updated.id,
        //     label: `${updated.firstName} ${updated.lastName}`.trim() || updated.username || updated.id,
        //     path: `/user/${updated.id}`,
        // };
        // await this.logUpdated('users', id, existing, updated, auditInfo);

        return this.sanitize(updated);
    }

    async changePassword(id: string, passwordHash: string) {
        const existing = await this.repository.findById(id);
        if (!existing) throw new NotFoundError('User not found');
        const updated = await this.repository.update(id, { passwordHash });

        // const auditInfo: AuditInfo = {
        //     id: updated.id,
        //     label: `${updated.firstName} ${updated.lastName}`.trim() || updated.username || updated.id,
        //     path: `/user/${updated.id}`,
        // };
        // await this.logUpdated('users', id, existing, { passwordChanged: true }, auditInfo);

        return this.sanitize(updated);
    }

    async changeOwnPassword(id: string, currentPassword: string, newPassword: string) {
        const existing = await this.repository.findById(id);
        if (!existing) throw new NotFoundError('User not found');
        const valid = await verifyPassword(existing.passwordHash, currentPassword);
        if (!valid) throw new UnauthorizedError('Current password is incorrect');
        const passwordHash = await hashPassword(newPassword);
        return this.changePassword(id, passwordHash);
    }

    async deleteUser(id: string) {
        const existing = await this.repository.findById(id);
        if (!existing) throw new NotFoundError('User not found');
        this.assertCanModifyTarget(existing);
        await this.repository.hardDelete(id);

        // const auditInfo: AuditInfo = {
        //     id: existing.id,
        //     label: `${existing.firstName} ${existing.lastName}`.trim() || existing.username || existing.id,
        //     path: `/user/${existing.id}`,
        // };
        // await this.logDeleted(
        //     'users',
        //     id,
        //     { username: existing.username, email: existing.email, role: existing.role },
        //     auditInfo,
        // );

        return true;
    }
}
