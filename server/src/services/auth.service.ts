import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Context } from 'hono';

import { db } from '../db/client';
import { NewUser, sessions, User } from '../db/schema/users';
import { ConflictError, UnauthorizedError } from '../lib/errors';
import { signAccessToken } from '../lib/jwt';
import { hashPassword, verifyPassword } from '../lib/password';
import { generateRefreshToken, hashRefreshToken, refreshTokenExpiry } from '../lib/refresh-token';
import { UserModel } from '../models/user.model';

export interface RegisterInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RefreshInput {
    refreshToken: string;
}

export type AuthUserResponse = Omit<User, 'passwordHash'>;

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
    user: AuthUserResponse;
}

export class AuthService {
    constructor(private userModel = new UserModel(db)) {}

    private toAuthUser(user: User): AuthUserResponse {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...safeUser } = user;

        return safeUser;
    }

    async register(c: Context, input: RegisterInput): Promise<AuthResponse> {
        const normalizedEmail = input.email.toLowerCase();
        const baseUsername = (input.username ?? normalizedEmail.split('@')[0]).trim();

        const existingByEmail = await this.userModel.getByEmail(normalizedEmail);
        if (existingByEmail) {
            throw new ConflictError('Email already exists');
        }

        const existingByUsername = await this.userModel.getByUsername(baseUsername);
        if (existingByUsername) {
            throw new ConflictError('Username already exists');
        }

        const passwordHash = await hashPassword(input.password);

        const newUser: NewUser = {
            email: normalizedEmail,
            username: baseUsername,
            firstName: input.firstName,
            lastName: input.lastName,
            passwordHash,
            role: 'user',
            isActive: true,
            phone: null,
        };

        const user = await this.userModel.create(newUser);

        return this.issueTokenPair(c, user as User);
    }

    async login(c: Context, input: LoginInput): Promise<AuthResponse> {
        const normalizedEmail = input.email.toLowerCase();

        const user = await this.userModel.getByEmail(normalizedEmail);

        const dummyHash =
            '$argon2id$v=19$m=65536,t=3,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

        const valid = await verifyPassword(user?.passwordHash ?? dummyHash, input.password);

        if (!user || !valid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('Account is not active');
        }

        return this.issueTokenPair(c, user as User);
    }

    async refresh(c: Context, input: RefreshInput): Promise<AuthResponse> {
        const tokenHash = hashRefreshToken(input.refreshToken);

        // Fetch session with a FOR UPDATE lock (if using a transactional DB)
        const result = await db.transaction(async (tx) => {
            const [session] = await tx
                .select()
                .from(sessions)
                .where(
                    and(
                        eq(sessions.refreshTokenHash, tokenHash),
                        isNull(sessions.revokedAt),
                        gt(sessions.expiresAt, new Date()),
                    ),
                )
                .for('update') // locks the row
                .limit(1);

            if (!session) {
                throw new UnauthorizedError('Invalid or expired refresh token');
            }

            const user = await this.userModel.findById(session.userId) as User;
            if (!user || !user.isActive) {
                throw new UnauthorizedError('User not found or inactive');
            }

            // Generate new refresh token
            const newRefreshToken = generateRefreshToken();
            const newHash = hashRefreshToken(newRefreshToken);

            // Update the session with the new token hash and new expiry
            await tx
                .update(sessions)
                .set({
                    refreshTokenHash: newHash,
                    expiresAt: refreshTokenExpiry(),
                    userAgent: c.req.header('user-agent') || null,
                    ipAddress: this.resolveRequestIp(c),
                })
                .where(eq(sessions.id, session.id));

            // Sign new access token
            const accessToken = signAccessToken({
                userId: user.id,
                organizationId: user.id,
                role: user.role,
                sessionId: session.id,
            });

            return {
                accessToken,
                refreshToken: newRefreshToken,
                user: this.toAuthUser(user),
            };
        });

        return result;
    }

    async getCurrentUser(userId: string, sessionId: string): Promise<AuthUserResponse> {
        const activeSession = await db
            .select({ id: sessions.id })
            .from(sessions)
            .where(
                and(
                    eq(sessions.id, sessionId),
                    eq(sessions.userId, userId),
                    isNull(sessions.revokedAt),
                    gt(sessions.expiresAt, new Date()),
                ),
            )
            .limit(1);

        if (activeSession.length === 0) {
            throw new UnauthorizedError('Session has expired or been revoked');
        }

        const user = await this.userModel.findById(userId) as User | null;

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('Account is not active');
        }

        return this.toAuthUser(user);
    }

    async logout(input: RefreshInput): Promise<void> {
        const tokenHash = hashRefreshToken(input.refreshToken);

        await db
            .update(sessions)
            .set({ revokedAt: new Date() })
            .where(eq(sessions.refreshTokenHash, tokenHash));
    }

    private async issueTokenPair(c: Context, user: User): Promise<AuthResponse> {
        const refreshToken = generateRefreshToken();

        const [session] = await db
            .insert(sessions)
            .values({
                userId: user.id,
                refreshTokenHash: hashRefreshToken(refreshToken),
                userAgent: c.req.header('user-agent') ?? null,
                ipAddress: this.resolveRequestIp(c),
                expiresAt: refreshTokenExpiry(),
            })
            .returning({
                id: sessions.id,
            });

        const accessToken = signAccessToken({
            userId: user.id,
            organizationId: user.id,
            role: user.role,
            sessionId: session.id,
        });

        return {
            accessToken,
            refreshToken,
            user: this.toAuthUser(user),
        };
    }

    private resolveRequestIp(c: Context): string | null {
        return (
            c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
                ?? c.req.header('x-real-ip')
                ?? null
        );
    }
}
