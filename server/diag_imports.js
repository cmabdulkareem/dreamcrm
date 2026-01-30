
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileToTest = path.join(__dirname, 'index.js');
const content = fs.readFileSync(fileToTest, 'utf8');

const imports = content.match(/from\s+['"](.+?)['"]/g);
if (imports) {
    for (const imp of imports) {
        const match = imp.match(/from\s+['"](.+?)['"]/);
        if (match) {
            const impPath = match[1];
            if (impPath.startsWith('.')) {
                const fullPath = path.resolve(__dirname, impPath);
                if (!fs.existsSync(fullPath) && !fs.existsSync(fullPath + '.js') && !fs.existsSync(fullPath + '/index.js')) {
                    console.log(`MISSING: ${impPath} (resolved to ${fullPath})`);
                } else {
                    console.log(`OK: ${impPath}`);
                }
            } else {
                console.log(`EXT: ${impPath}`);
            }
        }
    }
}
