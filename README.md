# SmartGen AI

SmartGen AI is a full-stack AI content generation platform. It helps users create platform-ready text, captions, hashtags, image-based content, rewrites, and beta voice-cloned audio using a React frontend and Node/Express backend.

## Main Features

- AI content writer for Instagram, TikTok, YouTube, LinkedIn, Facebook, X, Threads, Pinterest, Snapchat, WhatsApp, Email, Blog, and Website formats.
- Image Content Generator for captions, hashtags, and marketing copy from uploaded images.
- Rewrite tool for improving, shortening, expanding, or changing tone of existing text.
- Voice Cloning Beta with record/upload voice sample, script input, background generation, audio preview, and MP3 download.
- User authentication, profile, preferences, saved history, feedback, and admin dashboard.
- Platform-aware prompt handling so selected formats return focused and useful outputs.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios, Framer Motion, React Icons |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB |
| Authentication | JWT |
| AI Text/Image | Google Gemini API |
| Voice Cloning | F5-TTS via private Gradio URL through backend |
| Uploads | Multer |
| Tests | Jest, Supertest |

## Project Structure

```text
SmartGen-AI/
  README.md
  .gitignore
  frontend/
    src/
      components/
      pages/
      services/
      utils/
    public/
    .env.example
    package.json
    package-lock.json
    vite.config.js
    index.html
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    tests/
    utils/
    .env.example
    package.json
    package-lock.json
    seedAdmin.js
    server.js
```

## Prerequisites

Install these before running the project:

- Node.js 18 or later
- npm
- MongoDB running locally or a MongoDB Atlas connection string
- Google Gemini API key
- Optional for Voice Cloning: active F5-TTS Gradio URL

## Environment Setup

Create environment files from the examples.

### Backend

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smartgen-ai
MONGODB_TEST_URI=mongodb://localhost:27017/smartgen-ai-test
JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRE=7d
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.1-flash-lite,gemini-2.5-flash-lite,gemini-2.0-flash-lite,gemini-2.5-flash
FRONTEND_URL=http://localhost:3000,http://127.0.0.1:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
F5_GRADIO_URL=
```

`F5_GRADIO_URL` is only needed for Voice Cloning. Keep it private and update it whenever a new temporary Gradio URL is generated.

### Frontend

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Install Dependencies

Open a terminal in the project root.

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Run Locally

Start MongoDB first.

### Start Backend

```bash
cd backend
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

### Start Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

## Optional Admin Seed

To create the default admin user, run:

```bash
cd backend
node seedAdmin.js
```

Check `backend/seedAdmin.js` before using this in production.

## Build Frontend

```bash
cd frontend
npm run build
```

## Run Backend Tests

```bash
cd backend
npm test
```

## Architecture & Deployment Notes

- **Voice Cloning Runtime**: The voice cloning feature utilizes an external Gradio runtime (e.g., Google Colab). The external Gradio host must remain active to process voice cloning requests.
- **Audio Processing**: Staged reference voice audio and cloned outputs are processed temporarily on the backend server. By default, optional user-specific reference audio is stored browser-locally to ensure privacy.

## Common Issues

### npm says package.json not found

Run commands inside the correct folder:

```bash
cd backend
npm install
```

or:

```bash
cd frontend
npm install
```

### Frontend cannot reach backend

Make sure backend is running on port `5000` and frontend `.env` has:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### CORS error

Make sure backend `.env` includes the frontend URL:

```env
FRONTEND_URL=http://localhost:3000,http://127.0.0.1:3000
```

### Voice Cloning offline

Make sure `F5_GRADIO_URL` is set in `backend/.env` and the Gradio/Colab runtime is active.

