# EduMentor: AI-Powered Quiz Generation System

## Comprehensive System Documentation

This document outlines the complete architecture, features, and implementation details of the EduMentor AI Quiz Generation module (also known as the Adaptive Concept Engine or ACE).

---

## 1. System Overview

EduMentor is a full-stack web application designed to help students learn faster by automatically generating study materials (quizzes, flashcards) from uploaded course notes. The system operates entirely locally, utilizing local LLMs (Large Language Models) via Ollama, ensuring total data privacy and zero API costs.

### Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, React Router.
- **Backend**: Node.js, Express.js.
- **AI Engine**: Local Ollama Server (`phi3` model).
- **File Processing**: `multer`, `pdf-parse`, `mammoth` (DOCX), `tesseract.js` (Images).
- **Data Persistent**: File-system based JSON storage (`/data/`).

---

## 2. Frontend Implementation (`/client`)

The frontend provides a modern, responsive user interface for uploading documents and configuring the quiz.

### Key Components

- **`AceCreate.jsx` (Dashboard / Creation UI)**
  - **File Upload Zone**: Allows drag-and-drop or clicking to upload files. Validates file types (PDF, DOCX, PNG/JPG) and tracks state.
  - **Configuration Panel**: Users can select:
    - _Question Types_: Multiple Choice, True/False, Short Answer.
    - _Difficulty Level_: Easy, Medium, Hard.
    - _Quantity_: Dynamic input field to request ANY number of questions (controls increment by 1).
  - **Status Indicators**: Shows clear loading states ("Processing Files...", "Generating Quiz...").
- **`aceApi.js` (API Service Layer)**
  - Handles all `fetch` requests to the Node.js backend (`http://localhost:5050`).
  - Functions: `uploadMaterial`, `generateQuiz`, `regenerateQuiz`, `submitAnswers`, `checkHealth`.

---

## 3. Backend Implementation (`/api`)

The backend functions as the orchestrator, handling file processing, AI prompt engineering, state management, and strict JSON validation.

### Core API Routes (`server.js`)

- `POST /api/materials/upload` (Alias: `/upload-material`) - Uploads files and extracts text.
- `POST /api/quiz/generate` (Alias: `/generate-quiz`) - Generates questions from uploaded text.
- `POST /api/answers/submit` (Alias: `/submit-answers`) - Scores user answers.
- `POST /api/quiz/regenerate` (Alias: `/regenerate`) - Regenerates a quiz.
- `GET /api/quiz/health` - Checks if Ollama and the AI model are running.

### Key Modules & Functions

#### 1. File Upload & Parsing (`src/utils/fileParser.js` & `src/controllers/material.controller.js`)

- Uses `multer` to accept uploads and store them temporarily in `./uploads`.
- Routes the file to the correct parser based on MIME type:
  - `pdf-parse`: Extracts raw text from PDFs.
  - `mammoth`: Extracts raw text from DOCX files.
  - `tesseract.js`: Performs Optical Character Recognition (OCR) on images.
- The extracted text is saved to persistent local storage using `src/services/materialStore.js` (saved as JSON in `./data/materials/`).

#### 2. Quiz Controller (`src/controllers/quiz.controller.js`)

- Receives the quiz configuration (`materialId`, `questionType`, `difficulty`, `quantity`).
- Retrieves the extracted text from storage.
- Passes parameters to the Prompt Builder.
- Sends the prompt to the Ollama Service.
- Receives the AI's response, passes it through the JSON Sanitizer, and saves the final Quiz object to `./data/quizzes/`.

#### 3. Prompt Engineering (`src/utils/promptBuilder.js`)

- **Aggressive Speed Optimization**: Truncates the study material to a maximum of **1,000 characters**. This prevents the local LLM from taking several minutes to read massive PDFs, keeping generation times under 45 seconds.
- **Strict Templating**: Dynamically builds a harsh, rule-based prompt that injects a concrete JSON example (e.g., exactly how a True/False array should look).
- **Behavioral Enforcement**: Commands the AI to output _only_ valid JSON with absolutely no markdown headers or conversational filler.

#### 4. Local AI Service (`src/services/ollama.service.js`)

- Communicates directly with the local Ollama daemon (`http://127.0.0.1:11434`).
- **Model**: Defaults to `phi3` (optimized for speed and low memory usage, 2.4GB).
- **Performance Tuning Variables applied**:
  - `temperature: 0.4`: Lowers AI creativity to force predictable, stable JSON output.
  - `num_ctx: 1024`: Shrinks the AI's memory context window. This uses significantly less RAM and makes initialization instant.
  - `num_predict: 1536`: Caps the generation length, preventing the AI from rambling on forever and wasting processing time.

#### 5. Output Sanitization (`src/utils/jsonSanitizer.js`)

- Local LLMs frequently make syntax errors or wrap outputs in markdown block quotes (`json ... `).
- This module uses a 3-pass strategy to rescue AI output:
  1.  Strips all markdown wrapping and attempts a clean `JSON.parse()`.
  2.  If that fails, it uses Regex to find the first `[` and last `]` to selectively extract just the questions array, ignoring trailing conversational garbage.
  3.  Throws explicit errors if the JSON is completely broken, triggering the backend's automatic retry logic.

#### 6. Answer Controller (`src/controllers/answer.controller.js`)

- Accepts the user's answers and compares them against the correct answers saved in the Quiz JSON.
- For "Short Answer" text inputs, it performs fuzzy string matching or simple keyword checking to grant points without requiring a 100% exact character match.
- Returns a final score, percentage grade, and detailed explanation for every question.

---

## 4. Workflows & Data Flow

### A. The "Generation" Workflow

1.  **User UI**: Drag/Drop PDF -> Click "Generate".
2.  **Frontend**: `POST /api/materials/upload` with FormData.
3.  **Backend**: Multer saves file -> Parser extracts 7,000 chars of text -> Store assigns `materialId = mat_123` -> Responds `200 OK`.
4.  **Frontend**: Automatically triggers `POST /api/quiz/generate` with `{ materialId: "mat_123", quantity: 15, type: "multiple_choice" }`.
5.  **Backend**:
    - Fetches `mat_123` text.
    - Truncates to 1,000 chars.
    - Builds specialized prompt.
    - Calls Ollama API (`/api/generate`) with `phi3`.
    - Waits ~30 seconds.
    - Receives raw text, runs through `jsonSanitizer`.
    - Saves Quiz to disk with `quizId = quiz_456`.
6.  **Frontend**: Receives the Array of questions, redirects the user to the Quiz Session interface.

---

## 5. Summary of Recent Fixes & Optimizations

- **Quantity Unlimited**: Removed the hardcoded 50 question limit, allowing users to type any valid number into the frontend input.
- **CORS Preflight Corrected**: Added `app.options()` and explicitly defined allowed headers to prevent the browser from blocking requests with `Failed to fetch`.
- **10x Speed Improvement**: Changed the default model from `llama3` to `phi3`, reduced context windows `num_ctx`, and truncated text parsing. Operations that used to take 3-5 minutes now execute in a fraction of the time.
