import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

export async function solveCaptchaWithLLM(base64: string): Promise<string> {
  // remove prefix kalau ada (data:image/png;base64,...)
  const cleaned = base64.replace(/^data:image\/\w+;base64,/, "");

  const imageBuffer = Buffer.from(cleaned, "base64");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Apa teks yang ada di dalam gambar captcha ini? Jawab hanya teksnya saja tanpa penjelasan.",
          },
          {
            inlineData: {
              mimeType: "image/png", // 🔥 pakai PNG biar lebih akurat
              data: imageBuffer.toString("base64"),
            },
          },
        ],
      },
    ],
  });

  return response.text?.trim() || "";
}

// Example usage
// (async () => {
//   const dummyBase64 = "YOUR_BASE64_IMAGE";
//   const result = await solveCaptchaWithLLM(dummyBase64);
//   console.log(result);
// })();