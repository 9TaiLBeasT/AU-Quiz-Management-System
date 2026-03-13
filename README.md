# AU Quiz Management System

A high-performance university assessment platform built with React, FastAPI, and Supabase. Features include AI-powered quiz generation, PDF parsing, real-time analytics, and role-based access control.

## 🚀 Features

- **Multi-Role Support**: Distinct dashboards and permissions for **Admin**, **Faculty**, and **Student**.
- **AI Quiz Generation**: Effortlessly generate MCQs from text prompts or PDF uploads using OpenRouter (Llama 3 / Gemma 2).
- **Live Analytics**: Monitor student progress and quiz performance with interactive charts.
- **Secure Assessments**: Anti-cheat measures (tab switching detection) and results visibility control.
- **Modern UI**: Sleek, glassmorphic design system with full responsiveness.

## 🛠 Tech Stack

- **Frontend**: React, Vite, Axios, Recharts, CSS Modules.
- **Backend**: FastAPI (Python), httpx, Pydantic.
- **Database**: Supabase (PostgreSQL) with Row-Level Security (RLS).
- **AI**: OpenRouter API.

## 📦 Project Structure

```text
├── backend/          # FastAPI server
├── frontend/         # React + Vite application
├── database/         # SQL schema & migration scripts
└── README.md         # Documentation
```

## ⚙️ Setup & Installation

### Backend
1. Navigate to `/backend`.
2. Create a virtual environment: `python -m venv venv`.
3. Install dependencies: `pip install -r requirements.txt`.
4. Configure `.env` with your Supabase and OpenRouter credentials.
5. Run: `uvicorn main:app --reload`.

### Frontend
1. Navigate to `/frontend`.
2. Install dependencies: `npm install`.
3. Configure `.env` with your Supabase URL and Anon Key.
4. Run: `npm run dev`.

## 📄 License
This project is licensed under the MIT License.
