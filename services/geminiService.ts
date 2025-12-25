
import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeCrop = async (
  imageData: string, 
  description: string, 
  targetLang: Language
): Promise<DiagnosisResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData.split(',')[1],
          },
        },
        {
          text: `You are the KROPS AI Lead Agronomist. Perform a "Certified Agronomic Analysis" based on this crop image and description: "${description}".
          
          Identify the crop name (in ${targetLang} script and English) and the specific disease.
          Provide a professional prescription including a specific medicine/chemical name (e.g., "Tricyclazole 75% WP"), exact dosage (e.g., 0.6 ml per 1L), coverage (e.g., per 1 acre), and operational logic (safety instructions).
          
          Return valid JSON only.
          All descriptive fields must be translated to ${targetLang} naturally.
          
          Fields:
          - crop: Name of crop (e.g. "వరి (Rice)")
          - disease: Name of disease (e.g. "వరి అగ్గి తెగులు (Rice Blast)")
          - medicineName: Specific product/chemical name for visual identification (in English for generation accuracy).
          - prescription: Detailed treatment instructions
          - dosage: Specific concentration (e.g. "0.6 గ్రాములు per 1L water")
          - timing: Application timing or coverage (e.g. "120 గ్రాములు per 200 లీటర్ల నీటిలో")
          - safety: Protective measures for the farmer.`
        }
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          crop: { type: Type.STRING },
          disease: { type: Type.STRING },
          medicineName: { type: Type.STRING },
          prescription: { type: Type.STRING },
          dosage: { type: Type.STRING },
          timing: { type: Type.STRING },
          safety: { type: Type.STRING },
        },
        required: ["crop", "disease", "medicineName", "prescription", "dosage", "timing", "safety"],
      }
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from AI");
  return JSON.parse(text) as DiagnosisResult;
};

export const generateMedicinePhoto = async (medicineName: string): Promise<string | undefined> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A high-quality, professional studio photograph of an agricultural medicine bottle for farmers. The bottle is labeled clearly with the name "${medicineName}". The packaging is professional, showing a clean design typical of agricultural fungicides or pesticides. Neutral, bright background. Product shot style.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return undefined;
};
