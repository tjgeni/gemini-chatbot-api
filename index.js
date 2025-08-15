import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Explicit CORS configuration for development
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    // and requests from localhost or 127.0.0.1 on any port.
    if (
      !origin ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow common methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Explicitly allow common headers
  credentials: true, // Allow cookies to be sent with requests (if applicable)
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions)); // Apply explicit CORS options globally
app.use(express.json());
app.use(express.static('public'));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-2.5-flash';

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function extractText(resp) {
  try {
    const text =
      resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp?.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp?.response?.candidates?.[0]?.content?.text;

    return text ?? JSON.stringify(resp, null, 2);
  } catch (error) {
    console.error('Error extracting text:', error);
    return JSON.stringify(resp, null, 2);
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    console.log(req);
    if (!Array.isArray(messages)) throw new Error('messages must be an array');

    const contents = messages.map((message) => ({
      role: message.role,
      parts: [{ text: message.content }],
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
    });

    res.json({ result: extractText(response) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
