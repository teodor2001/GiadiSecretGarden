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

    return "gemini-1.5-flash";
  } catch (e) {
    return "gemini-1.5-flash";
  }
}

export async function POST(req: Request) {
  try {
    const { question, userAnswer, correctAnswer } = await req.json();

    const apiKey = process.env.GOOGLE_API_KEY || "";
    const modelName = await getBestModelName(apiKey);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
      Sei un tutor gentile ma preciso.
      Domanda: "${question}"
      Risposta Corretta (dal libro): "${correctAnswer}"
      Risposta dello Studente: "${userAnswer}"

      Compito: Valuta se la risposta dello studente è concettualmente corretta rispetto a quella del libro. Ignora errori di battitura o differenze di fraseggio se il concetto è giusto.
      
      Rispondi SOLO con questo JSON:
      {
        "isCorrect": boolean (true se il concetto è giusto, false se è sbagliato o incompleto),
        "feedback": "string" (Se giusto: un breve complimento. Se sbagliato: spiega gentilmente cosa manca o cosa è errato in max 2 frasi)
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonStartIndex = text.indexOf('{');
    const jsonEndIndex = text.lastIndexOf('}') + 1;
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        text = text.substring(jsonStartIndex, jsonEndIndex);
    }

    const evaluation = JSON.parse(text);

    return NextResponse.json(evaluation);

  } catch (error) {
    console.error("Errore Check:", error);
    return NextResponse.json({ isCorrect: false, feedback: "Errore di connessione. Riprova." }, { status: 500 });
  }
}