import { readFile } from "fs/promises";
export async function readFileAsBase64(path) {
    return { success: true, base64: await readFile(path, "base64") };
}
//# sourceMappingURL=readFileAsBase64.js.map