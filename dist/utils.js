"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeWixRequest = exports.parseInstance = void 0;
const crypto_1 = require("crypto");
function parseInstance(instance, appSecret) {
    var parts = instance.split("."), hash = parts[0], payload = parts[1];
    if (!payload) {
        return null;
    }
    if (!validateInstance(hash, payload, appSecret)) {
        console.log("Provided instance is invalid: " + instance);
        return null;
    }
    return JSON.parse(base64Decode(payload, "utf8"));
}
exports.parseInstance = parseInstance;
function validateInstance(hash, payload, secret) {
    if (!hash) {
        return false;
    }
    hash = base64Decode(hash);
    var signedHash = (0, crypto_1.createHmac)("sha256", secret)
        .update(payload)
        .digest("base64");
    return hash === signedHash;
}
function base64Decode(input, encoding = "base64") {
    return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(encoding);
}
function authorizeWixRequest(req) {
    const authorization = req.headers.authorization;
    if (!authorization)
        throw new Error("No authorization header");
    const instance = parseInstance(authorization, process.env.WIX_APP_SECRET);
    if (!instance)
        throw new Error("Invalid instance");
    return instance;
}
exports.authorizeWixRequest = authorizeWixRequest;
//# sourceMappingURL=utils.js.map