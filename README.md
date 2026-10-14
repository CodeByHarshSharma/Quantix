# Quantix

A Perplexity-style AI chat app built with the MERN stack. Streams AI responses in real time and uses web search when fresh information is needed.

## Features

- Real-time AI response streaming with Socket.IO
- Web search using Tavily
- Stop generation and preserve partial responses
- Chat history with rename and delete
- Markdown rendering with code blocks and lists
- Email verification and JWT authentication using httpOnly cookies
- Protected chats with user ownership checks

## Tech Stack

- **Frontend:** React, Vite, Redux Toolkit, React Router
- **Backend:** Node.js, Express, Mongoose, Socket.IO
- **Database:** MongoDB
- **AI:** Google Gemini, LangChain
- **Search:** Tavily
- **Authentication:** JWT, bcrypt, Nodemailer

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Gemini API key
- Tavily API key
- SMTP credentials

### Run Locally

Start the backend and frontend in separate terminals using `npm run dev` in each directory.

## Architecture

Messages are sent through Socket.IO. The backend authenticates users, verifies chat ownership, saves messages, streams AI responses, and persists the final answer.

LangChain agents use Tavily for web search when needed. Socket.IO events handle streaming, tool status, stopping generation, errors, and chat titles.

## Deployment

Express serves the built frontend from the `public` folder, allowing the frontend, API, and Socket.IO connection to share one origin.

Configure production environment variables on your hosting platform and use HTTPS for secure authentication cookies.

## Roadmap

- Smoother response streaming
- Token revocation on logout
- Source citations for web searches
- Regenerate and edit messages
