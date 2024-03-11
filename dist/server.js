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
const behavior_directives_collection_1 = require("./behavior-directives-collection");
const utils_1 = require("./utils");
const generative_ai_1 = require("@google/generative-ai");
dotenv_1.default.config();
const PORT = process.env.PORT || 8000;
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)({
    origin(requestOrigin, callback) {
        const whitelist = [
            "http://localhost",
            "https://wix-chat-app-backend.azurewebsites.net",
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
const history = [];
app.post("/api/v1/chat/product", function (req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { prompt, product } = req.body;
        const apiKey = (_a = process.env.GOOGLE_GEMINI_API_KEY) !== null && _a !== void 0 ? _a : '';
        const configuration = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const generationConfig = {
            stopSequences: ["red"],
            maxOutputTokens: 400,
            temperature: 0.9,
            topP: 0.1,
            topK: 16,
        };
        const safetySettings = [
            {
                category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: generative_ai_1.HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
                category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ];
        const modelId = "gemini-pro";
        const model = configuration.getGenerativeModel({ model: modelId, generationConfig, safetySettings });
        const promptEngine = `You are Business Buddy, a chatbot that helps business owners with their businesses. 
  You are tasked with helping a business owner with one of their products.
  The business owner will chat with you about their product and you will give them advice on how to improve it.

  The product is presented below as a JSON object:
  ${product}
  
  Answer the following question from the business owner:
  ${prompt}`;
        try {
            const result = yield model.generateContent(promptEngine);
            const response = yield result.response;
            const text = response.text();
            res.send({ response: text });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: "Internal server error" });
        }
    });
});
app.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
});
//# sourceMappingURL=server.js.map