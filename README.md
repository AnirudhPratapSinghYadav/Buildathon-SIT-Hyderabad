# StudyScene

> **"Your notes are static. Your teacher doesn't have to be."**

StudyScene transforms static visual study material (handwritten notes, textbook pages, lecture slides, whiteboards, diagrams, equations) into an interactive learning environment powered by Gemini's multimodal understanding.

---

## 🌟 GitHub Repository
[https://github.com/AnirudhPratapSinghYadav/Buildathon-SIT-Hyderabad](https://github.com/AnirudhPratapSinghYadav/Buildathon-SIT-Hyderabad)

---

## 🚀 Key Features

1. **Multimodal Visual Understanding**: Upload any note or study page. Gemini performs educational + visual understanding, detecting titles, subjects, difficulty levels, concepts, and key interactive regions.
2. **Interactive Bounding Box Region Overlays**: Automatically highlights equations, diagrams, definitions, and paragraphs. Click any hotspot on your actual study image to explore.
3. **Concept Relationship Map**: Pure SVG/CSS node-edge visualization mapping concept dependencies (e.g., *Neuron → Weighted Sum → Activation → Output → Loss → Backpropagation*).
4. **Multi-Level Explanations & "I Don't Understand This"**:
   - **Simple**: Everyday analogies and jargon-free intuition.
   - **Standard**: Undergraduate academic explanation.
   - **Deep**: Underlying mechanisms, assumptions, and math.
   - **I Don't Understand This**: 6-part patient breakdown (What it means, why it exists, how it works, analogy, concrete example, self-check).
5. **Adaptive Practice Challenge Engine**: Generates 5 distinct questions directly grounded in your study material with varying cognitive levels (recall, application, reasoning).
6. **"Try a Similar Problem"**: When an answer is incorrect, generates a genuinely new problem testing the same core concept with different values or scenarios.
7. **Personalized Session Weak Spot Tracking**: Tracks attempt counts, correct answers, and identifies weak spots per concept in real-time.
8. **Cascading Gemini Model Fallback System**: Production-ready reliability layer automatically fallback-cascading across model generations (`gemini-3.6-flash` → `gemini-3.5-flash` → `gemini-2.5-flash` → `gemini-2.0-flash`).
9. **Automatic Coordinate Scale Normalization**: Detects and scales 0..1000 coordinate bounds to 0..1 normalized bounds seamlessly for pixel-perfect region highlights on any image resolution.

---

## ⚙️ Architecture

```
Browser (React + Vite + TypeScript)
       │
       ▼ (HTTP / Multipart / Base64)
Express API Server (Node.js + TypeScript)
       │
       ▼ (@google/genai SDK + Structured JSON Schemas)
Google Gemini Multimodal AI (Cascading Fallback Chain)
```

- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS design tokens (Academic/Calm Palette).
- **Backend**: Express.js, TypeScript, Multer file processing, Server-side API key protection.
- **AI SDK**: `@google/genai` (Unified official SDK with `responseMimeType: "application/json"` & `responseSchema`).

---

## 🔒 Security & Quality Principles

- **Server-Side API Key Protection**: `GEMINI_API_KEY` is strictly server-side and never exposed in client bundles or network payloads.
- **Cascading Fallback Resiliency**: Classifies errors into non-retryable (401/403/safety block), model-specific (404/503/429), and transient (timeout/500), cascading through fallback models automatically.
- **Robust Schema Sanitization**: Guarantees all returned JSON structures have fallback values and normalized bounding boxes before reaching the client interface.

---

## 🛠️ Setup & Running

### Prerequisites
- Node.js (v18+)
- Gemini API Key from Google AI Studio

### 1. Environment Setup
Copy `.env.example` to `.env` inside the server directory:
```bash
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-3.6-flash
PORT=3001
```

### 2. Start the Express Backend
```bash
cd server
npm install
npm run dev
```
Backend runs at `http://localhost:3001` (Health check: `http://localhost:3001/api/health`).

### 3. Start the React Frontend
```bash
cd client
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 📱 Local Mirror Path
- `E:\sithyd buldathon google`
