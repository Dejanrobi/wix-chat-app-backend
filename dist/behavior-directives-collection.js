"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBehaviorDirective = exports.saveBehaviorDirective = void 0;
let behaviorDirectives = {};
function saveBehaviorDirective(instanceId, directive) {
    behaviorDirectives[instanceId] = directive;
}
exports.saveBehaviorDirective = saveBehaviorDirective;
function getBehaviorDirective(instanceId) {
    return behaviorDirectives[instanceId];
}
exports.getBehaviorDirective = getBehaviorDirective;
//# sourceMappingURL=behavior-directives-collection.js.map