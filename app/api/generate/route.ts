import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

async function getBestModelName(apiKey: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (!data.models) return "gemini-1.5-flash";

    const flashModel = data.models.find((m: any) => 
      m.name.toLowerCase().includes("flash") && 
      m.supportedGenerationMethods.includes("generateContent")
    );
    if (flashModel) return flashModel.name.replace("models/", "");

    const standardModel = data.models.find((m: any) => 
      m.name.toLowerCase().includes("gemini-1.5") && 
      m.supportedGenerationMethods.includes("generateContent")
    );
    if (standardModel) return standardModel.name.replace("models/", "");

    const anyModel = data.models.find((m: any) => m.supportedGenerationMethods.includes("generateContent"));
    if (anyModel) return anyModel.name.replace("models/", "");

    return "gemini-1.5-flash";
  } catch (e) {
    console.error("Impossibile recuperare lista modelli, uso fallback", e);
    return "gemini-1.5-flash";
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const apiKey = process.env.GOOGLE_API_KEY || "";
    
    const modelName = await getBestModelName(apiKey);
    console.log("Modello selezionato automaticamente:", modelName);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
      Sei un tutor universitario esperto. Analizza questo documento PDF e crea 10 Flashcards (Domanda e Risposta) fondamentali per superare l'esame.
      
      REGOLE:
      1. Rispondi SOLO con un array JSON puro. Niente markdown, niente \`\`\`json, niente preamboli.
      2. Formato esatto: [{"question": "...", "answer": "..."}, ...]
      3. Sii preciso e usa un linguaggio chiaro.
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf",
        },
      },
      prompt,
    ]);

    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonStartIndex = text.indexOf('[');
    const jsonEndIndex = text.lastIndexOf(']') + 1;
    
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        text = text.substring(jsonStartIndex, jsonEndIndex);
    }

    const flashcards = JSON.parse(text);

    return NextResponse.json({ flashcards });

  } catch (error) {
    console.error("Errore AI:", error);
    return NextResponse.json({ error: "Errore durante l'analisi del file" }, { status: 500 });
  }
}