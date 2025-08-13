import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.post('/api/chat', async (req, res) => {
  const userMesage = req.body.message;

  if (!userMesage) {
    return res.status(400).json({ reply: 'Message is required' });
  }

  try {
    const result = await model.generateContent(userMesage);
    const text = result.response.text();
    res.json({ reply: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
