import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Configuration, OpenAIApi } from "openai";
import {
  getBehaviorDirective,
  saveBehaviorDirective,
} from "./behavior-directives-collection";
import { authorizeWixRequest } from "./utils";

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

dotenv.config();

const PORT = process.env.PORT || 4000;

const app = express();
app.use(bodyParser.json());


// const whitelist = [
//   "http://localhost",
//   `https://${process.env.WIX_APP_ID}.wix.run`,
// ];

// const corsOptions: cors.CorsOptions = {
//   origin: (origin, callback) => {
//       if ( origin && whitelist.includes(origin)) {
//       callback(null, true);
//       } else {
//       callback(new Error('Not allowed by CORS'));
//       }
//   },
// };

// app.use(cors(corsOptions));

app.use(
  cors({
      origin(requestOrigin, callback) {
          const whitelist = [
              "http://localhost",
              "https://wix-chat-app-backend.azurewebsites.net",
              `https://${process.env.WIX_APP_ID}.wix.run`,
          ];

          if (
              requestOrigin && 
              whitelist.some((whitelistOrigin)=>
                  requestOrigin.includes(whitelistOrigin)
              )
          ) {
              callback(null, true);
          } else {
              callback(new Error("Not allowed by CORS"));
          }
      },
  })
);


app.post("/settings", async function (req, res) {
  const { instanceId } = authorizeWixRequest(req);
  const behaviorDirective = req.body.behaviorDirective;
  saveBehaviorDirective(instanceId, behaviorDirective);
  res.send({});
});

app.get("/api/v1", (req, res)=>{
  // console.log(req.body)
  res.json({success:"true", message: "Business Buddy application"})
})

app.get("/settings", async function (req, res) {
  const { instanceId } = authorizeWixRequest(req);
  const behaviorDirective =
    getBehaviorDirective(instanceId) ??
    "You always end your messages with a Spanish goodbye.";
  res.send({ behaviorDirective });
});

// Tracking the history:
const history: string[] = [];

app.post("/api/v1/chat/product", async function (req, res) {
  // const { instanceId } = authorizeWixRequest(req);

  // console.log(instanceId)
  // console.log(req.body)

  const { prompt, product} = req.body
  // const { messages, product } = req.body as {
  //   messages: Array<{
  //     author: "Business Buddy" | "User";
  //     text: string;
  //   }>;
  //   product: string;
  // };


  // configuring google gemini
  // configuring google generative AI
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY ?? ''; // Using optional chaining and nullish coalescing operator to provide a default value
  const configuration = new GoogleGenerativeAI(apiKey);

  // Model initialization
  const generationConfig = {
    stopSequences: ["red"],
    maxOutputTokens: 400,
    temperature: 0.9,
    topP: 0.1,
    topK: 16,
  };

  const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
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
  ${prompt}`

  // res.send({ response: promptEngine })


  try {
    // const { prompt } = req.body;
    // console.log(prompt)

    const result = await model.generateContent(promptEngine);
    const response = await result.response;
    
    const text = response.text();
    // // console.log(text);

    // history.push(text);
    // // console.log(history);

    res.send({ response: text });
    // // res.status(200).json({success: true})
    
    
  } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
  }
 
});

app.listen(PORT, () => {
  console.log(`Server started on port: ${PORT}`);
});
