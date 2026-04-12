"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export async function refineContent(content: string, platform: string = "general") {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an expert social media manager. 
    Refine the following content to be more engaging, professional, and optimized for ${platform}.
    Keep it concise and maintain the original intent.
    Do not include any preamble or extra text, just the refined content.
    
    Content: "${content}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("AI Refinement Error:", error);
    throw new Error("Failed to refine content");
  }
}
