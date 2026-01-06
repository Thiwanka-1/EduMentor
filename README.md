# 🎓 EduMentor – AI-Powered Adaptive Learning Platform

## 📌 Project Overview

EduMentor is an **AI-powered adaptive learning platform designed for university students**.  
It integrates multiple intelligent components to deliver **personalized, engaging, and syllabus-aware learning support** using students’ own lecture materials and reference books.

Unlike generic AI chatbots, EduMentor focuses on **how students learn**, adapting explanations, guidance, and revision strategies dynamically without manual tagging or syllabus configuration.

---

## 🧠 Core Functional Components

### 1️⃣ Peer-Like AI Study Buddy Agent

- Acts as a friendly, casual peer rather than a teacher
- Uses informal tone and relatable examples
- Encourages students to ask questions without fear
- Ideal for quick clarification and continuous engagement

### 2️⃣ Multi-View Explanation Generator (MVEG)

- Explains the same concept in multiple formats:
  - Simple explanation
  - Analogy-based explanation
  - Code-based explanation
  - Summary
- Allows students to choose the explanation style they understand best
- Supports different learning preferences

### 3️⃣ Interactive Avatar Mentor (LLM-based Digital Twin)

- A visual and voice-enabled AI mentor
- Behaves like a real academic mentor:
  - Provides guidance and motivation
  - Helps with study planning
  - Offers structured explanations
- Uses an animated or 3D avatar interface for emotional engagement

### 4️⃣ Adaptive Concept Reinforcement Engine (ACE)

- Analyzes student interaction history automatically
- Identifies weak concepts without manual tagging
- Generates targeted:
  - Quizzes
  - Flashcards
  - Revision sessions
- Continuously adapts reinforcement strategies over time

---

## 🏗️ System Architecture

- **Frontend**

  - Built using React and Tailwind CSS
  - Provides UI for Study Buddy, Avatar Mentor, MVEG views, and dashboards
  - Handles PDF uploads and user interactions

- **Backend API**

  - Manages authentication, user sessions, and interaction logs
  - Routes requests to AI services and reinforcement logic
  - Supports scalable microservice-style expansion

- **AI & LLM Layer**

  - Uses Hugging Face open-source models (free-tier)
  - Limited use of API-based LLMs for enhanced responses
  - Model-agnostic design allows easy switching

- **Adaptive Reinforcement Engine (ACE)**

  - Tracks learning behavior and performance
  - Identifies weak areas dynamically
  - Generates personalized reinforcement content

- **Knowledge Sources**
  - User-uploaded lecture notes (PDFs)
  - Reference books
  - Course-specific academic materials

---

## 🧩 Project Dependencies

### Frontend Dependencies

- **React** – User interface framework
- **Vite** – Frontend build tool
- **Tailwind CSS** – Styling and responsive design
- **Axios / Fetch API** – API communication

### Backend Dependencies

- **Node.js + Express** or **Python (FastAPI / Flask)**
- **MongoDB** – User data, interaction history, concept tracking

### AI & Machine Learning

- **Hugging Face Transformers**
- **Open-source LLMs (free-tier models)**
- **Embedding & Tokenization libraries**
- **PDF parsing libraries** for lecture material extraction

### Infrastructure & Deployment

- **Docker-ready architecture**
- **Cloud deployment support**
- **Rate limiting & caching** for API token management

---
