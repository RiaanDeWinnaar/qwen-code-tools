"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFileAsBase64 = readFileAsBase64;
const promises_1 = require("fs/promises");
async function readFileAsBase64(path) {
    return { success: true, base64: await (0, promises_1.readFile)(path, "base64") };
}
//# sourceMappingURL=readFileAsBase64.js.map