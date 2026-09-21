import { gte, lte, SQL } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

export type DateRange = {
    from?: Date;
    to?: Date;
};

/**
 * Bygger 0, 1 eller 2 villkor beroende på vad som skickats in.
 * Spreada resultatet in i and(...) tillsammans med dina andra villkor -
 * and() ignorerar tomma listor och hanterar 1 villkor precis som eq() ensamt.
 */
export function buildDateRangeConditions(column: PgColumn, range?: DateRange): SQL[] {
    const conditions: SQL[] = [];

    if (range?.from) {
        conditions.push(gte(column, range.from));
    }

    if (range?.to) {
        conditions.push(lte(column, range.to));
    }

    return conditions;
}
