// ─── Prompt Templates for StudyScene ───
// All prompts that instruct Gemini on what to do.

export function getSystemInstruction(): string {
  return `You are StudyScene Teacher — an expert educational AI that understands visual study materials.

Your responsibilities:
- Understand visual study material (notes, textbooks, diagrams, equations, whiteboards)
- Explain concepts accurately, grounded in the uploaded material
- Distinguish between what is explicitly present in the image and what you are adding as educational context
- Adapt explanations to the learner's requested level
- Identify potential misconceptions
- Generate useful practice questions directly from the material
- Never reveal quiz answers before the student submits their response
- Never pretend uncertain information is visible in the image
- Clearly label any additional knowledge you provide beyond what is in the image
- Prefer concise, focused educational explanations over lengthy essays

When analyzing images:
- Use normalized coordinates (0 to 1) for bounding boxes, where (0,0) is the top-left corner
- Be precise about what regions contain
- Do not fabricate region IDs or bounding boxes for content that is not visible`;
}

export function getAnalysisPrompt(): string {
  return `Analyze this study material as an educational artifact.

Look at the entire image carefully and identify:

1. TITLE: What is the main topic of this page?
2. SUBJECT: What academic subject does this belong to?
3. DIFFICULTY: Is this beginner, intermediate, or advanced material?
4. SUMMARY: Write 1-2 sentences describing what this page teaches.
5. CONCEPTS: List the key concepts taught on this page (max 10). For each concept, provide:
   - A unique id (e.g., "concept_1")
   - The concept name
   - A brief description
   - Which region IDs on the page relate to this concept
6. RELATIONSHIPS: How do these concepts connect to each other? For each relationship:
   - Which concept leads to which
   - A short label describing the relationship (e.g., "uses", "produces", "passes through")
7. REGIONS: Identify visually meaningful regions on the page. For each region:
   - A unique id (e.g., "region_1")
   - A short label
   - The type (title, diagram, equation, definition, example, paragraph, list, or other)
   - A brief description of what it contains
   - A bounding box using normalized coordinates (0 to 1): x, y (top-left corner), width, height
8. SUGGESTED QUESTIONS: List 3-5 questions that could test understanding of this material.

Be thorough but precise. Every concept should connect to at least one region. Every region's bounding box must accurately reflect where that content appears in the image.`;
}

export function getExplainPrompt(
  regionLabel: string,
  regionDescription: string,
  mode: string
): string {
  const levelInstructions: Record<string, string> = {
    simple: 'Explain as if the learner is seeing this concept for the very first time. Use everyday language and simple analogies. Avoid jargon.',
    standard: 'Explain at an undergraduate level. Be precise but accessible. Include relevant terminology.',
    deep: 'Explain the mechanism, underlying assumptions, mathematical intuition, and relationship to adjacent concepts. Be thorough but structured.',
  };

  const level = levelInstructions[mode] || levelInstructions.standard;

  return `The student has selected a region labeled "${regionLabel}" from their uploaded study material.

Region description: "${regionDescription}"

${level}

Provide your explanation using this structure:
- direct: A clear, direct explanation of what this is
- intuitive: An intuitive way to think about it (analogy or mental model)
- why_it_matters: Why this concept is important in context
- example: A concrete example demonstrating the concept
- common_mistake: A common misconception or mistake students make
- quick_check: A simple question the student can ask themselves to verify understanding

Stay grounded in the uploaded material. If you add knowledge beyond what is visible, clearly note it.
Keep each section concise — 2-4 sentences maximum.`;
}

export function getDontUnderstandPrompt(
  regionLabel: string,
  regionDescription: string
): string {
  return `The student is looking at a region labeled "${regionLabel}" from their uploaded study material and says: "I don't understand this."

Region description: "${regionDescription}"

Help them understand by explaining:
- direct: What it means — in the simplest possible terms
- intuitive: Why it exists — what problem does it solve?
- why_it_matters: How it works — step by step
- example: One intuitive analogy to something from everyday life
- common_mistake: One concrete example with specific values or scenarios
- quick_check: One quick self-check question they can answer to verify they now understand

Be patient and encouraging. Do not use jargon without explaining it.
Keep each section to 2-3 sentences maximum. Clarity over completeness.`;
}

export function getChallengePrompt(
  analysisContext: string,
  weakSpotsContext?: string
): string {
  const weakSpotNote = weakSpotsContext
    ? `\n\nThe student has shown weakness in these areas:\n${weakSpotsContext}\n\nWeight questions toward these weak areas while still covering other concepts.`
    : '';

  return `Based on the uploaded study material, generate exactly 5 practice questions.

Study material analysis:
${analysisContext}
${weakSpotNote}

Requirements:
- Generate exactly 5 questions
- Distribute difficulty: 2 easy, 2 medium, 1 hard
- Use different cognitive levels: recall, understanding, application, reasoning
- Prioritize these question types: MCQ (at least 2), short_answer (at least 1), and numerical or explain_why for the rest
- Every question must be connected to a concept or region from the uploaded material
- For MCQ questions, provide exactly 4 options
- For true_false questions, options should be ["True", "False"]
- The correct_answer must exactly match one of the options (for MCQ/true_false) or be a clear answer string
- Include a brief explanation for each answer
- Set source_region_id to the most relevant region, or null if no specific region applies

Each question must have a unique id (e.g., "q_1", "q_2", etc.).

IMPORTANT: All questions must be answerable from the study material plus reasonable foundational knowledge. Do not ask about topics not covered in the material.`;
}

export function getSimilarProblemPrompt(
  originalQuestion: string,
  conceptName: string,
  userAnswer: string
): string {
  return `The student answered a question incorrectly. Create a genuinely new problem that tests the SAME underlying concept.

Original question: "${originalQuestion}"
Concept being tested: "${conceptName}"
Student's incorrect answer: "${userAnswer}"

Requirements:
- Create a genuinely new problem — do NOT simply reword the original question
- Change the numbers, scenario, or representation
- Test the same learning objective as the original question
- If it's an MCQ, provide 4 new options
- Include the correct answer and a clear explanation
- Set the difficulty to "medium"
- Use a unique id like "similar_1"

The new problem should help the student practice the concept they struggled with, approaching it from a slightly different angle.`;
}

export function getNextStepPrompt(
  analysisContext: string,
  quizResultsContext: string
): string {
  return `Based on the student's quiz performance and the study material, recommend what they should study next.

Study material:
${analysisContext}

Quiz results:
${quizResultsContext}

Provide:
- recommendation: A 2-3 sentence personalized learning recommendation. Be specific about which concepts to review and in what order.
- weak_concepts: List the concept names where the student needs improvement
- suggested_action: Either "review" (if they got many wrong), "practice" (if they need more practice), or "advance" (if they did well and should move to harder material)

Be encouraging but honest about areas that need work.`;
}
