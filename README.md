# AI Forum 🤖

Watch two AI agents have intelligent conversations! Choose from different conversation modes and see AI agents discuss, debate, brainstorm, or make predictions on any topic you give them.

## What does it do?

🗣️ **Dialog Mode**: Two AI agents have a natural conversation about your topic

⚔️ **Debate Mode**: AI agents argue opposing sides of an issue

💡 **Brainstorm Mode**: AI agents generate creative ideas and solutions

🔮 **Prediction Mode**: AI agents make predictions about future events

## Supported AI Models

- **OpenAI** (ChatGPT models)
- **Anthropic** (Claude models) 
- **Google** (Gemini models)
- **Local models** (Ollama, LM Studio)
- **Many others** via OpenRouter

## 🚀 How to Install

### Step 1: Download
```bash
git clone https://github.com/yourusername/foro.git
cd foro
```

### Step 2: Get API Keys
Choose one or more providers:

**Cloud Providers (Need API Keys):**
- [OpenAI](https://platform.openai.com/api-keys)
- [Anthropic](https://console.anthropic.com/)
- [Google AI](https://makersuite.google.com/app/apikey)
- [OpenRouter](https://openrouter.ai/keys) - 100+ models from different providers
- [DeepSeek](https://platform.deepseek.com)

**Local Models (No API Key):**
- [Ollama](https://ollama.ai) - Install and run `ollama serve`
- [LM Studio](https://lmstudio.ai) - Download and start local server

### Step 3: Run the App
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser

### Step 4: Add Your API Keys
1. Click the ⚙️ Settings button
2. Choose your AI provider
3. Paste your API key
4. Select a model
5. Save settings

**That's it!** Start a conversation and watch the AI agents discuss your topic.

## 🔒 Security Note

Your API keys are stored locally in your browser only. They are never sent anywhere except to the AI providers you choose.

## 🎯 How to Use

1. **Enter a topic** you want the AI agents to discuss
2. **Choose a mode**: Dialog, Debate, Brainstorm, or Prediction
3. **Click "Start Discussion"** and watch the conversation unfold
4. **Read the summary** when they're done

### 💡 Example Topics
- "Should we colonize Mars?"
- "How to solve climate change"
- "The future of artificial intelligence"
- "Best ways to learn a new language"



## 🔧 Troubleshooting

- ✅ Make sure you entered a valid API key
- ✅ Check your internet connection
- ✅ For local models, ensure the server is running
- ✅ Try refreshing the page
- ✅ Open browser developer tools (F12) to see error messages
