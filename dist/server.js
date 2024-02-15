"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const openai_1 = require("openai");
const behavior_directives_collection_1 = require("./behavior-directives-collection");
const utils_1 = require("./utils");
dotenv_1.default.config();
const PORT = process.env.PORT || 4000;
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)({
    origin(requestOrigin, callback) {
        const whitelist = [
            "http://localhost",
            `https://${process.env.WIX_APP_ID}.wix.run`,
        ];
        if (requestOrigin &&
            whitelist.some((whitelistOrigin) => requestOrigin.includes(whitelistOrigin))) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
}));
app.post("/settings", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { instanceId } = (0, utils_1.authorizeWixRequest)(req);
        const behaviorDirective = req.body.behaviorDirective;
        (0, behavior_directives_collection_1.saveBehaviorDirective)(instanceId, behaviorDirective);
        res.send({});
    });
});
app.get("/api/v1", (req, res) => {
    res.json({ success: "true", message: "Business Buddy application" });
});
app.get("/settings", function (req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { instanceId } = (0, utils_1.authorizeWixRequest)(req);
        const behaviorDirective = (_a = (0, behavior_directives_collection_1.getBehaviorDirective)(instanceId)) !== null && _a !== void 0 ? _a : "You always end your messages with a Spanish goodbye.";
        res.send({ behaviorDirective });
    });
});
app.post("/chat/product", function (req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { instanceId } = (0, utils_1.authorizeWixRequest)(req);
        const { messages, product } = req.body;
        const configuration = new openai_1.Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new openai_1.OpenAIApi(configuration);
        const completion = yield openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are Business Buddy, a chatbot that helps business owners with their businesses. 
        You are tasked with helping a business owner with one of their products.
        The business owner will chat with you about their product and you will give them advice on how to improve it.

        The business owner has given the following directive as to how you should respond to their messages:
        ${(0, behavior_directives_collection_1.getBehaviorDirective)(instanceId)}

        The product is presented below as a JSON object:
        ${product}`,
                },
                ...messages.map((message) => ({
                    role: message.author === "Business Buddy"
                        ? "assistant"
                        : "user",
                    content: message.text,
                })),
            ],
            max_tokens: 2000,
            n: 1,
        });
        res.send({ message: (_a = completion.data.choices[0].message) === null || _a === void 0 ? void 0 : _a.content });
    });
});
app.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
});
//# sourceMappingURL=server.js.map