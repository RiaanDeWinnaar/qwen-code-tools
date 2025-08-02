"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomBase64 = generateRandomBase64;
const crypto_1 = require("crypto");
function generateRandomBase64(bytesOfRandomness = 18) {
    const randomBytesBuffer = (0, crypto_1.randomBytes)(bytesOfRandomness);
    return randomBytesBuffer.toString("base64");
}
//# sourceMappingURL=generateRandomBase64.js.map