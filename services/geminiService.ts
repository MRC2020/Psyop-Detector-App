import { GoogleGenAI, Type } from "@google/genai";
import { NCI_CRITERIA } from "../constants";
import { AnalysisResult } from "../types";

export const analyzeTextWithGemini = async (
  text: string, 
  fileData?: { mimeType: string; data: string }
): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct a system instruction that embeds the NCI criteria
  const criteriaText = NCI_CRITERIA.map(
    (c) => `ID ${c.id}: ${c.category} - ${c.question} (Example: ${c.example})`
  ).join("\n");

  const systemInstruction = `
    You are an expert intelligence analyst using the "NCI Engineered Reality Scoring System" (PSYOPS Identification Tool).
    Your task is to analyze the provided content (text or document) and score it on a scale of 1 to 5 for each of the 20 criteria.
    
    Scoring Guide:
    1 = Not Present (No signs of manipulation)
    5 = Overwhelmingly Present (Clear, strong evidence of manipulation)
    
    Criteria List:
    ${criteriaText}

    Analyze objectively. If there is insufficient information for a category, default to a lower score (1 or 2) unless the omission itself is manipulative (Category 4).
  `;

  // Prepare contents
  const parts: any[] = [];

  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.data,
      },
    });
  }

  if (text) {
    parts.push({ text: text });
  }

  if (parts.length === 0) {
    throw new Error("No content provided for analysis");
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts },
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER, description: "The criteria ID (1-20)" },
                score: { type: Type.INTEGER, description: "Score from 1 to 5" },
                reasoning: { type: Type.STRING, description: "Brief justification for the score" }
              },
              required: ["id", "score", "reasoning"]
            }
          }
        }
      }
    }
  });

  const jsonText = response.text;
  if (!jsonText) {
    throw new Error("No response from Gemini");
  }

  try {
    const parsed = JSON.parse(jsonText);
    const scores: Record<number, number> = {};
    const reasoning: Record<number, string> = {};

    parsed.analysis.forEach((item: any) => {
      scores[item.id] = item.score;
      reasoning[item.id] = item.reasoning;
    });

    return { scores, reasoning };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to parse analysis results");
  }
};