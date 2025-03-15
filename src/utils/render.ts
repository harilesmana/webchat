import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

// Dapatkan path direktori saat ini
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function renderView(view: string, data: object = {}) {
    const filePath = path.join(__dirname, "../views", `${view}.ejs`);
    
    return new Promise((resolve, reject) => {
        ejs.renderFile(filePath, data, (err, str) => {
            if (err) reject(err);
            else resolve(str);
        });
    });
}