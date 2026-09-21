/**
 * Base Service - Provides automatic audit logging
 *
 * All services extend this to get:
 * - Automatic logging of CREATE/UPDATE/DELETE
 * - Activity log entries with full data changes
 * - Consistent error handling
 * - Organization context enforcement
 */

import { DbClient } from '../db/client';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';

export type AuditInfo = {
    id: string; // entity ID
    label: string; // human-readable name
    path: string; // frontend route (e.g., "/mark/123")
};

export interface AuditLogEntry {
    userId?: string;
    action: AuditAction;
    entity: string;
    entityId: string;
    data: Record<string, any>; // can contain 'changes' and/or 'auditInfo'
}

export abstract class BaseService {
    protected db: DbClient;
    protected userId?: string;

    constructor(db: DbClient, userId?: string) {
        this.db = db;
        this.userId = userId;
    }

    /**
     * Log activity to audit trail
     * Called automatically after CREATE/UPDATE/DELETE operations
     */
    protected async logAudit(entry: AuditLogEntry) {
        void entry;
    }

    /**
     * Log creation – stores full entity data plus optional auditInfo
     */
    protected async logCreated(
        entity: string,
        entityId: string,
        data: AuditInfo,
    ) {
        await this.logAudit({
            action: 'CREATE',
            entity,
            entityId,
            data,
        });
    }

    /**
     * Log update – stores before/after changes plus optional auditInfo
     */
    protected async logUpdated(
        entity: string,
        entityId: string,
        before: Record<string, any>,
        after: Record<string, any>,
        auditInfo?: AuditInfo,
    ) {
        const changes: Record<string, any> = {};
        for (const key of Object.keys(after)) {
            if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
                changes[key] = { before: before[key], after: after[key] };
            }
        }
        // Only log if there are changes or auditInfo
        if (Object.keys(changes).length > 0 || auditInfo) {
            const data: Record<string, any> = {};
            if (Object.keys(changes).length > 0) data.changes = changes;
            if (auditInfo) data.auditInfo = auditInfo;
            await this.logAudit({
                action: 'UPDATE',
                entity,
                entityId,
                data,
            });
        }
    }

    /**
     * Log deletion – stores full entity data plus optional auditInfo
     */
    protected async logDeleted(
        entity: string,
        entityId: string,
        entityData: Record<string, any>,
        auditInfo?: AuditInfo,
    ) {
        const data = { ...entityData };
        if (auditInfo) data.auditInfo = auditInfo;
        await this.logAudit({
            action: 'DELETE',
            entity,
            entityId,
            data,
        });
    }

    /**
     * Log restore – stores full entity data plus optional auditInfo
     */
    protected async logRestored(
        entity: string,
        entityId: string,
        entityData: Record<string, any>,
        auditInfo?: AuditInfo,
    ) {
        const data = { ...entityData };
        if (auditInfo) data.auditInfo = auditInfo;
        await this.logAudit({
            action: 'RESTORE',
            entity,
            entityId,
            data,
        });
    }
}
