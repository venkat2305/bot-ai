# Bot AI - Next.js Application

This is an AI chatbot application built with Next.js, featuring multiple AI model integrations including Groq, OpenRouter, and Perplexity models.

## Features

- Modern chat interface with sidebar navigation
- Multiple AI model support (Groq, OpenRouter, Perplexity)
- Chat history and persistence using localStorage
- Real-time streaming responses
- Dark/Light theme toggle
- Responsive design with Tailwind CSS
- Smooth animations with Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory and add your API keys:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
GROQ_API_KEY=your_groq_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

**Note:** These API keys are now securely handled on the server side and will not be exposed to the client.

### Running the Application

#### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

The page will reload when you make changes and you'll see any lint errors in the console.

#### Production Build

```bash
npm run build
npm start
```

Builds the app for production and starts the production server.

## Project Structure

- `/pages` - Next.js pages and routing
- `/src/components` - React components
- `/src/hooks` - Custom React hooks
- `/src/utils` - Utility functions
- `/src/assets` - Static assets
- `/public` - Public static files

## API Keys Setup

To use the AI features, you'll need to obtain API keys from:

- [Groq](https://groq.com/) - For Groq models
- [OpenRouter](https://openrouter.ai/) - For various AI models
- [Perplexity](https://perplexity.ai/) - For Perplexity models

## Technologies Used

- Next.js 14
- React 18
- Tailwind CSS
- Framer Motion
- OpenAI SDK
- Groq SDK
- React Markdown
- Lucide React Icons

## Learn More

To learn more about Next.js, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
