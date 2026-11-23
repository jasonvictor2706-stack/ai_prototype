import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw Object.assign(
      new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in Settings > Secrets."),
      { statusCode: 400 }
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function formatGeminiError(err: unknown, context: string): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const statusMatch =
    (typeof err === "object" && err !== null && "status" in err && typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : undefined) ||
    (typeof err === "object" && err !== null && "statusCode" in err && typeof (err as { statusCode: unknown }).statusCode === "number"
      ? (err as { statusCode: number }).statusCode
      : undefined);

  const upper = raw.toUpperCase();

  if (statusMatch === 403 || upper.includes("PERMISSION_DENIED")) {
    return {
      status: 403,
      message: `${context} failed: API key permission denied. Check your API key in Settings > Secrets.`,
    };
  }
  if (statusMatch === 429 || upper.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message: `${context} requires a billing-enabled Gemini API key or exceeded quota. Select a paid key in Settings > Secrets.`,
    };
  }
  if (statusMatch === 400 || upper.includes("API_KEY_INVALID")) {
    return {
      status: 400,
      message: `${context} failed: Invalid or missing API key. Check Settings > Secrets.`,
    };
  }
  if (statusMatch === 404 || upper.includes("NOT_FOUND")) {
    return {
      status: 404,
      message: `${context} failed: Requested Gemini model was not found.`,
    };
  }

  return {
    status: statusMatch && statusMatch >= 400 && statusMatch < 600 ? statusMatch : 500,
    message: raw || `${context} failed due to an unexpected error.`,
  };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollStatsForClass(charClass: string): { health: number; mana: number; strength: number } {
  const normalized = charClass.toLowerCase();

  if (
    normalized.includes("mage") ||
    normalized.includes("wizard") ||
    normalized.includes("sorcer") ||
    normalized.includes("warlock") ||
    normalized.includes("alchemist") ||
    normalized.includes("necromancer") ||
    normalized.includes("chronomancer")
  ) {
    return {
      health: randomInt(75, 115),
      mana: randomInt(115, 160),
      strength: randomInt(20, 48),
    };
  }

  if (
    normalized.includes("warrior") ||
    normalized.includes("paladin") ||
    normalized.includes("knight") ||
    normalized.includes("berserker") ||
    normalized.includes("warden") ||
    normalized.includes("barbarian")
  ) {
    return {
      health: randomInt(130, 180),
      mana: randomInt(25, 65),
      strength: randomInt(68, 98),
    };
  }

  if (
    normalized.includes("rogue") ||
    normalized.includes("assassin") ||
    normalized.includes("ranger") ||
    normalized.includes("thief") ||
    normalized.includes("bard") ||
    normalized.includes("hunter")
  ) {
    return {
      health: randomInt(95, 135),
      mana: randomInt(55, 100),
      strength: randomInt(52, 82),
    };
  }

  return {
    health: randomInt(95, 155),
    mana: randomInt(60, 130),
    strength: randomInt(40, 85),
  };
}

const PORTRAIT_VARIATIONS = [
  "dramatic three-quarter heroic angle, warm amber torchlight from the left",
  "dynamic expressive smirk, emerald arcane potion glow from below",
  "fierce battle-ready gaze, cool silver moonlight rim lighting and drifting sparks",
  "calm enigmatic posture, golden candlelight illuminating intricate attire",
  "spirited adventurer pose, swirling atmospheric mist and warm bronze highlights",
  "stoic close-up bust, rich chiaroscuro shadows and subtle glowing runes behind",
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.post("/api/character", async (req: Request, res: Response) => {
    try {
      const ai = getAiClient();
      const body = (req.body ?? {}) as { previousNames?: unknown };
      const previousNames = Array.isArray(body.previousNames)
        ? body.previousNames.filter((n): n is string => typeof n === "string").slice(-15)
        : [];

      const avoidClause =
        previousNames.length > 0
          ? ` Do NOT reuse any of these names: ${previousNames.join(", ")}.`
          : "";

      const classesHint = [
        "Mage",
        "Rogue",
        "Warrior",
        "Alchemist",
        "Paladin",
        "Ranger",
        "Necromancer",
        "Spellblade",
        "Warlock",
        "Druid",
        "Chronomancer",
        "Bard",
      ];
      const suggestedClass = classesHint[Math.floor(Math.random() * classesHint.length)];

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Invent one original fantasy RPG character with a memorable, distinctive name (1 to 3 words, e.g. "Vespera Ashveil" or "Torin Ironflask") and a fantasy class (such as Mage, Rogue, Warrior, Alchemist, Paladin, Ranger, Spellblade, Warlock, Druid, or Bard — for variety consider ${suggestedClass} or another fitting fantasy archetype).${avoidClause}`,
        config: {
          systemInstruction:
            "You are a master fantasy worldbuilder. Create unique, evocative fantasy character names that avoid generic overused clichés like Elara, Kaelen, Aria, or Lyra. Return valid JSON only matching the schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "The character's unique fantasy name (1-3 words).",
              },
              charClass: {
                type: Type.STRING,
                description: "The character's fantasy RPG class (1-2 words, e.g. Mage, Rogue, Warrior, Alchemist).",
              },
            },
            required: ["name", "charClass"],
          },
        },
      });

      const rawText = (response.text ?? "").trim();
      const parsed = JSON.parse(rawText) as { name?: string; charClass?: string };

      const name = typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : "Aldric Thorne";
      const charClass =
        typeof parsed.charClass === "string" && parsed.charClass.trim() ? parsed.charClass.trim() : suggestedClass;

      const stats = rollStatsForClass(charClass);

      res.json({
        name,
        charClass,
        stats,
      });
    } catch (err) {
      const formatted = formatGeminiError(err, "Character generation");
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post("/api/backstory", async (req: Request, res: Response) => {
    try {
      const ai = getAiClient();
      const body = (req.body ?? {}) as { name?: unknown; charClass?: unknown };
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const charClass = typeof body.charClass === "string" ? body.charClass.trim() : "";

      if (!name || !charClass) {
        res.status(400).json({ error: "Character name and class are required to write a backstory." });
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Write a unique, atmospheric one-to-two-sentence fantasy origin story for ${name}, a ${charClass}.`,
        config: {
          systemInstruction:
            "You write concise, vivid fantasy character origin lore for tabletop RPG cards. Output strictly 1 or 2 crisp sentences in plain prose. No markdown, no quotation marks, no bullet points, no character stats.",
        },
      });

      const backstory = (response.text ?? "").trim().replace(/^["']|["']$/g, "");
      if (!backstory) {
        res.status(502).json({ error: "Gemini returned an empty backstory. Please try again." });
        return;
      }

      res.json({ backstory });
    } catch (err) {
      const formatted = formatGeminiError(err, "Backstory generation");
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post("/api/portrait", async (req: Request, res: Response) => {
    try {
      const ai = getAiClient();
      const body = (req.body ?? {}) as {
        name?: unknown;
        charClass?: unknown;
        variationIndex?: unknown;
      };
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const charClass = typeof body.charClass === "string" ? body.charClass.trim() : "";
      const variationIndex =
        typeof body.variationIndex === "number" && Number.isFinite(body.variationIndex)
          ? Math.abs(Math.floor(body.variationIndex))
          : 0;

      if (!name || !charClass) {
        res.status(400).json({ error: "Character name and class are required to generate a portrait." });
        return;
      }

      const variation = PORTRAIT_VARIATIONS[variationIndex % PORTRAIT_VARIATIONS.length];
      const prompt = [
        `Stylized cartoon and fantasy video game character portrait of ${name}, a ${charClass}.`,
        "Expressive hand-painted RPG game art style with crisp silhouettes, bold painterly brushwork, and rich medieval fantasy costume details.",
        `Composition & lighting: centered bust portrait, ${variation}, dark atmospheric alchemist studio backdrop.`,
        "No text, no letters, no watermark, no card frame or border.",
      ].join(" ");

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? "image/png";
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        res.status(502).json({ error: "Gemini did not return an image for this portrait. Please try again." });
        return;
      }

      res.json({ imageUrl });
    } catch (err) {
      const formatted = formatGeminiError(err, "Portrait generation");
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      const indexFile = path.join(distPath, "index.html");
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send("Build artifacts not found.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Alchemist's Grimoire listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
