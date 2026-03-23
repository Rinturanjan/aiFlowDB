import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import OpenAI from "openai";
import FlowResult from "./models/FlowResult.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://client-mycj.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://client-mycj.onrender.com",
    "X-OpenRouter-Title": "AI Flow App",
  },
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/api/ask-ai", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: "Prompt is required." });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        message: "OPENROUTER_API_KEY is missing in environment variables.",
      });
    }

    console.log("Received prompt:", prompt);
    console.log("Using model:", process.env.OPENROUTER_MODEL);
    console.log("API key exists:", !!process.env.OPENROUTER_API_KEY);

    const models = [
      process.env.OPENROUTER_MODEL,
      "google/gemma-3-27b-it:free",
      "mistralai/mistral-small-3.1-24b-instruct:free",
    ].filter(Boolean);

    const uniqueModels = [...new Set(models)];

    let completion = null;
    let lastError = null;

    for (const model of uniqueModels) {
      try {
        console.log("Trying model:", model);

        completion = await openrouter.chat.completions.create({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        console.log("Success with model:", model);
        break;
      } catch (err) {
        console.error(`Model failed: ${model}`);
        console.error(
          err?.error?.metadata?.raw ||
            err?.error?.message ||
            err?.message ||
            "Unknown model error"
        );
        lastError = err;
      }
    }

    if (!completion) {
      const allFailedMessage =
        lastError?.error?.metadata?.raw ||
        lastError?.error?.message ||
        "All free models are temporarily unavailable. Please try again in a few seconds.";

      return res.status(lastError?.status || 503).json({
        message: allFailedMessage,
      });
    }

    let answer = completion?.choices?.[0]?.message?.content;

    if (Array.isArray(answer)) {
      answer = answer
        .map((item) => {
          if (typeof item === "string") return item;
          if (item?.type === "text") return item.text;
          return "";
        })
        .join("");
    }

    if (!answer || !String(answer).trim()) {
      answer = "No response received from AI.";
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("OpenRouter full error:");
    console.error(error);

    const statusCode = error?.status || 500;
    const errorMessage =
      error?.error?.metadata?.raw ||
      error?.error?.message ||
      error?.message ||
      "Failed to get AI response.";

    return res.status(statusCode).json({
      message: errorMessage,
    });
  }
});

app.post("/api/save", async (req, res) => {
  try {
    const { prompt, response } = req.body;

    if (!prompt || !response) {
      return res
        .status(400)
        .json({ message: "Prompt and response are required." });
    }

    const savedData = await FlowResult.create({
      prompt,
      response,
    });

    return res.status(201).json({
      message: "Data saved successfully.",
      data: savedData,
    });
  } catch (error) {
    console.error("Save error:", error);

    return res.status(500).json({
      message: "Failed to save data.",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});