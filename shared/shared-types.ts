export type UserRole = 'owner' | 'admin' | 'user';

export interface CreateUserInput {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    role?: UserRole;
    isActive?: boolean;
    password: string;
}

export interface UpdateUserInput {
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    role?: UserRole;
    isActive?: boolean;
}

export type SelfUpdateInput = Omit<UpdateUserInput, 'role' | 'isActive'>;

export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

export interface User {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Attachment {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    storagePath?: string | null;
    uploadedAt: string;
}
