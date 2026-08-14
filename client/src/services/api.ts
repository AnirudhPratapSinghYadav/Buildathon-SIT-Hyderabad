// ─── API Client for StudyScene Backend ───

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

// ─── Helpers ───

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.json();
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix to get pure base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── API Functions ───

export async function analyzeImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse(response);
}

export async function explainRegion(
  imageBase64: string,
  mimeType: string,
  regionLabel: string,
  regionDescription: string,
  mode: string
) {
  const response = await fetch(`${API_BASE}/api/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: mimeType,
      region_label: regionLabel,
      region_description: regionDescription,
      mode,
    }),
  });

  return handleResponse(response);
}

export async function generateChallenge(
  imageBase64: string,
  mimeType: string,
  analysisContext: string,
  weakSpotsContext?: string
) {
  const response = await fetch(`${API_BASE}/api/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: mimeType,
      analysis_context: analysisContext,
      weak_spots_context: weakSpotsContext,
    }),
  });

  return handleResponse(response);
}

export async function generateSimilarProblem(
  imageBase64: string,
  mimeType: string,
  originalQuestion: string,
  conceptName: string,
  userAnswer: string
) {
  const response = await fetch(`${API_BASE}/api/similar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: mimeType,
      original_question: originalQuestion,
      concept_name: conceptName,
      user_answer: userAnswer,
    }),
  });

  return handleResponse(response);
}

export async function getNextStep(
  analysisContext: string,
  quizResultsContext: string
) {
  const response = await fetch(`${API_BASE}/api/next-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analysis_context: analysisContext,
      quiz_results_context: quizResultsContext,
    }),
  });

  return handleResponse(response);
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE}/api/health`);
  return handleResponse(response);
}

export { fileToBase64 };
