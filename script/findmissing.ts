import * as fs from 'fs';

function flattenObject(
    obj: Record<string, any>,
    prefix = '',
    result: Record<string, any> = {},
): Record<string, any> {
    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;

        if (
            value
            && typeof value === 'object'
            && !Array.isArray(value)
        ) {
            flattenObject(value, path, result);
        } else {
            result[path] = value;
        }
    }

    return result;
}

function findMissingTranslations(
    sourceFile: string,
    targetFile: string,
) {
    const source = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
    const target = JSON.parse(fs.readFileSync(targetFile, 'utf8'));

    console.log('Source keys:', Object.keys(source).length);
    console.log('Target keys:', Object.keys(target).length);

    const sourceKeys = Object.keys(flattenObject(source));
    const targetKeys = new Set(Object.keys(flattenObject(target)));

    const missingKeys = sourceKeys.filter(
        key => !targetKeys.has(key),
    );

    console.log(`Missing translations: ${missingKeys.length}`);
    missingKeys.forEach(key => console.log(key));
}

// Usage
findMissingTranslations('src/lang/en.json', 'src/lang/ar.json');
