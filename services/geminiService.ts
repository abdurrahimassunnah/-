
import { GoogleGenAI, Part } from "@google/genai";
import type { Page, WritingMode, UploadedFile, SupportedLanguage } from '../types';

let aiInstance: GoogleGenAI | null = null;

const getGeminiClient = (): GoogleGenAI => {
    if (aiInstance) return aiInstance;
    
    let apiKey = '';
    try {
        apiKey = (typeof process !== 'undefined' && process.env ? (process.env.API_KEY || process.env.GEMINI_API_KEY) : '')
                 || (import.meta as any).env?.VITE_GEMINI_API_KEY 
                 || (import.meta as any).env?.VITE_API_KEY;
    } catch (e) {
        // Safe fallback
    }

    if (!apiKey) {
        throw new Error("API_KEY is not configured. Please add GEMINI_API_KEY to your Netlify Environment Variables (under Site Configuration > Environment Variables) and re-deploy.");
    }
    
    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
};

const model = 'gemini-2.5-flash';
const TITLE_DELIMITER = '---TITLE---';
const PAGE_DELIMITER = '---PAGE---';
const FOOTNOTE_DELIMITER = '---FOOTNOTES---';

const languageMap: Record<SupportedLanguage, string> = {
    'en-US': 'English',
    'bn-IN': 'Bengali',
    'ar-SA': 'Arabic',
    'hi-IN': 'Hindi',
    'ur-PK': 'Urdu',
    'fa-IR': 'Farsi',
};

interface GenerationParams {
    mode: WritingMode;
    language: SupportedLanguage;
    topic?: string;
    biographySubject?: string;
    pageCount?: number;
    files: UploadedFile[];
    journalSample?: string;
}

const generateBookPrompt = (params: Omit<GenerationParams, 'files'>): string => {
    const { language, mode, topic, biographySubject, pageCount } = params;
    const langName = languageMap[language];
    
    const subject = mode === 'biography' 
        ? `a comprehensive biography about ${biographySubject}` 
        : `an in-depth book about ${topic}`;

    return `
You are an expert author and researcher. Your task is to write the beginning of ${subject} in ${langName}.

**Core Instructions:**
1.  **Language:** Write the entire text in ${langName}.
2.  **Structure:**
    *   First, create a compelling title for the book. The title should be separated by the exact delimiter: "${TITLE_DELIMITER}".
    *   Then, write the first 20 pages of the book.
    *   **Length:** Each page must have an average of 250 words (approximately 230 to 250 words per page).
    *   Each page's content must be separated by the exact delimiter: "${PAGE_DELIMITER}".
    *   After the content of a page, if there are any footnotes, add them separated by the exact delimiter: "${FOOTNOTE_DELIMITER}".
3.  **Content:** The content should be well-researched, engaging, and structured like a real book. Use Google Search to find information, cite interesting facts, and build a narrative.
4.  **Footnotes:** Use footnotes for citations, clarifications, or to provide extra information. For example: "The sky is blue.[1]\n\n${FOOTNOTE_DELIMITER}\n[1] Source about sky color."
5.  **Page Count:** The user has requested 20 pages, so provide exactly 20 pages.

Start now.
`;
};

const generateJournalPrompt = (params: Omit<GenerationParams, 'mode'>): string => {
    const { language, topic, journalSample, files } = params;
    const langName = languageMap[language];
    const hasSample = journalSample && journalSample.trim().length > 0;
    const hasFiles = files && files.length > 0;
    
    let prompt = `
You are a thoughtful and empathetic journal writing assistant. Your task is to help the user write a diary entry in ${langName}.

**Core Instructions:**
1.  **Language:** Write the entire text in ${langName}.
2.  **Task:** The user will provide a topic or a few sentences about their day (e.g., "${topic}"). Your job is to expand on this prompt, creating a creative, reflective, and personal diary entry from a first-person perspective.
3.  **Structure:**
    *   First, create a suitable title for the diary entry based on the content. The title should be separated by the exact delimiter: "${TITLE_DELIMITER}".
    *   Then, write the main body of the diary entry.
4.  **Length:** The entry should have an average of 250 words (approximately 230 to 250 words).
5.  **Content:** Do not use citations, footnotes, or page breaks. This is a single, continuous piece of writing. Use Google Search to enrich the entry with relevant thoughts, quotes, or ideas if it helps the narrative.
`;

    if (hasSample) {
        prompt += `
**CRITICAL: STYLE MIMICRY**
The user has provided a text sample of their writing style below. You MUST write the new entry mimicking this style EXACTLY.
-   **Tone:** Ignore any default "warm" tone. Adopt the EXACT emotional tone of the sample (e.g., angry, poetic, flat, chaotic).
-   **Structure:** Copy the sentence length and rhythm of the sample.
-   **Vocabulary:** Use the same level of vocabulary (simple vs. complex).
-   **Formatting:** If the sample uses bullet points or short paragraphs, do the same.

--- START WRITING SAMPLE ---
${journalSample}
--- END WRITING SAMPLE ---
`;
    } else if (hasFiles) {
         prompt += `
**CRITICAL: STYLE MIMICRY FROM FILES**
The user has attached files (PDF, Text, etc.) alongside this request. Treat these files as **Writing Samples** of the user's previous journal entries or writing style.
You MUST analyze the text within these attached files to understand the author's voice.
-   **Tone:** Mimic the emotional resonance found in the attached files.
-   **Style:** Observe sentence structures, vocabulary choices, and recurring themes in the files.
-   **Formatting:** Adopt a similar visual structure if apparent in the files.
-   **Task:** Write the new entry about "${topic}" as if it belongs in the same collection as the attached files.
`;
    } else {
        prompt += `
5.  **Tone:** The tone should be warm, introspective, and personal. It should feel like a real diary entry.
`;
    }

    prompt += `\nStart now.`;
    return prompt;
};

export const generateInitialContent = async (params: GenerationParams): Promise<{ content: Page[], title: string }> => {
    const textFiles = params.files.filter(f => f.mimeType.startsWith('text/'));
    const binaryFiles = params.files.filter(f => !f.mimeType.startsWith('text/'));

    const textFileContext = textFiles.length > 0
        ? `Here is additional context/content from user-uploaded text files:\n\n` + textFiles.map(f => `--- File: ${f.name} ---\n${f.content}`).join('\n\n')
        : '';
    
    const instructionalPrompt = params.mode === 'journal' 
        ? generateJournalPrompt({ language: params.language, topic: params.topic, journalSample: params.journalSample, files: params.files })
        : generateBookPrompt(params);

    const parts: Part[] = [{ text: `${instructionalPrompt}\n\n${textFileContext}` }];

    for (const file of binaryFiles) {
        parts.push({
            inlineData: {
                mimeType: file.mimeType,
                data: file.content // base64 string
            }
        });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
            tools: [{ googleSearch: {} }],
        }
    });

    const fullText = response.text.trim();
    
    let title = params.topic || 'Untitled';
    let contentBody = fullText;

    const titleParts = fullText.split(TITLE_DELIMITER);
    if (titleParts.length > 1) {
        title = titleParts[0].trim();
        contentBody = titleParts.slice(1).join(TITLE_DELIMITER).trim();
    } else {
        console.warn("Gemini model did not return a title. Using a default title.");
    }
    
    const pages = params.mode === 'journal' ? [contentBody] : contentBody.split(PAGE_DELIMITER).map(p => p.trim()).filter(Boolean);

    if (pages.length === 0 || pages.every(p => !p)) {
        console.error("Gemini model returned empty content.", { response: fullText });
        return { content: ["Content generation failed. Please try again."], title };
    }

    return { content: pages, title };
};

export const generateNextPages = async (
    history: string,
    language: SupportedLanguage,
    mode: WritingMode
): Promise<Page[]> => {
    const langName = languageMap[language];
    
    let prompt;
    
    if (mode === 'journal') {
        prompt = `
You are a thoughtful AI assistant continuing a personal journal entry in ${langName}.
Here is the previous content of the journal:
---
${history}
---
Your task is to write the next part of this journal entry.
-   **Language:** Write entirely in ${langName}.
-   **Content:** Continue the reflection or narrative naturally, maintaining the first-person perspective and personal tone.
-   **Length:** Write exactly one new page of content with approximately 230 to 250 words.
-   **Format:** Just return the text for the new page. Do NOT use any page delimiters unless you want to explicitly split it into multiple parts.
-   Do not repeat the title or previous content. Start directly with the continuation.
`;
    } else {
        prompt = `
You are an expert author continuing a book written in ${langName}.
Here is the existing content of the book:
---
${history}
---
Your task is to continue the narrative and write the next 20 pages.
-   **Language:** Write the entire text in ${langName}.
-   **Length:** Each page must have an average of 250 words (approximately 230 to 250 words per page).
-   Each page's content must be separated by the exact delimiter: "${PAGE_DELIMITER}".
-   Maintain the tone and style of the existing content.
-   Use footnotes for citations or extra info, separated by "${FOOTNOTE_DELIMITER}".
-   Do not repeat the title or previous content. Start directly with the new page content.
`;
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
    const newPages = response.text
      .trim()
      .split(PAGE_DELIMITER)
      .map(p => p.trim())
      .filter(Boolean);

    if (newPages.length === 0) {
        throw new Error("Failed to generate new pages from the model response.");
    }
      
    return newPages;
};
