class AIForum {
    constructor() {
        this.currentMode = 'dialog';
        this.isDiscussionActive = false;
        this.currentTurn = 0;
        this.maxTurns = 6;
        this.messages = [];
        this.settings = this.loadSettings();
        this.providers = this.initializeProviders();
        
        this.initializeElements();
        this.bindEvents();
        this.loadProviderModels();
    }

    initializeElements() {
        // Main elements
        this.mainContent = document.querySelector('.main-content');
        this.topicInput = document.getElementById('topicInput');
        this.startBtn = document.getElementById('startBtn');
        this.chatContainer = document.getElementById('chatContainer');
        this.chatSection = document.getElementById('chatSection');
        this.summarySection = document.getElementById('summarySection');
        this.summaryContent = document.getElementById('summaryContent');
        
        // Set initial state
        this.mainContent.classList.add('initial-state');
        
        // Mode buttons
        this.modeButtons = document.querySelectorAll('.mode-btn');
        
        // Control buttons
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        
        // Settings modal
        this.settingsModal = document.getElementById('settingsModal');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        
        // Settings inputs for Agent 1
        this.providerAgent1Select = document.getElementById('providerAgent1');
        this.modelAgent1Select = document.getElementById('modelAgent1');
        this.apiKeyAgent1Input = document.getElementById('apiKeyAgent1');
        this.baseUrlAgent1Input = document.getElementById('baseUrlAgent1');
        this.baseUrlAgent1Group = document.getElementById('baseUrlAgent1Group');
        
        // Settings inputs for Agent 2
        this.providerAgent2Select = document.getElementById('providerAgent2');
        this.modelAgent2Select = document.getElementById('modelAgent2');
        this.apiKeyAgent2Input = document.getElementById('apiKeyAgent2');
        this.baseUrlAgent2Input = document.getElementById('baseUrlAgent2');
        this.baseUrlAgent2Group = document.getElementById('baseUrlAgent2Group');
        
        // General settings
        this.maxTurnsInput = document.getElementById('maxTurns');

        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Mode selection
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectMode(btn.dataset.mode));
        });
        
        // Start discussion
        this.startBtn.addEventListener('click', () => this.startDiscussion());
        this.topicInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.startDiscussion();
            }
        });
        
        // Control buttons
        this.pauseBtn.addEventListener('click', () => this.pauseDiscussion());
        this.stopBtn.addEventListener('click', () => this.stopDiscussion());
        
        // Settings modal
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
        
        // Provider changes
        this.providerAgent1Select.addEventListener('change', () => this.onProviderChange(1));
        this.providerAgent2Select.addEventListener('change', () => this.onProviderChange(2));
        
        // Modal overlay click
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });
        
        // Load saved settings
        this.loadSettingsToUI();
    }

    initializeProviders() {
        return {
            openai: {
                name: 'OpenAI',
                baseUrl: 'https://api.openai.com/v1',
                models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
                requiresKey: true
            },
            anthropic: {
                name: 'Anthropic',
                baseUrl: 'https://api.anthropic.com/v1',
                models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022'],
                requiresKey: true
            },
            openrouter: {
                name: 'OpenRouter',
                baseUrl: 'https://openrouter.ai/api/v1',
                models: [], // Will be fetched dynamically
                requiresKey: true,
                fetchModels: true
            },
            lmstudio: {
                name: 'LM Studio',
                baseUrl: 'http://localhost:1234/v1',
                models: [], // Will be fetched dynamically
                requiresKey: false,
                fetchModels: true,
                showBaseUrl: true
            },
            ollama: {
                name: 'Ollama',
                baseUrl: 'http://localhost:11434/api',
                models: [], // Will be fetched dynamically
                requiresKey: false,
                fetchModels: true,
                showBaseUrl: true
            },
            google: {
                name: 'Google AI',
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'],
                requiresKey: true
            },
            cohere: {
                name: 'Cohere',
                baseUrl: 'https://api.cohere.ai/v1',
                models: ['command', 'command-light', 'command-nightly', 'command-r', 'command-r-plus'],
                requiresKey: true
            }
        };
    }

    selectMode(mode) {
        this.currentMode = mode;
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Update max turns based on mode
        if (mode === 'prediction') {
            this.maxTurns = 2;
        } else if (mode === 'brainstorm') {
            this.maxTurns = 2; // One round each AI
        } else if (mode === 'dialog') {
            this.maxTurns = 6; // 3 rounds each
        } else if (mode === 'debate') {
            this.maxTurns = 4; // 2 rounds each
        } else {
            this.maxTurns = parseInt(this.maxTurnsInput?.value) || 6;
        }
    }

    async startDiscussion() {
        const topic = this.topicInput.value.trim();
        if (!topic) {
            this.showError('Please enter a topic for discussion');
            return;
        }

        if (!this.validateSettings()) {
            this.openSettings();
            return;
        }

        this.isDiscussionActive = true;
        this.currentTurn = 0;
        this.messages = [];
        
        // Update UI and layout
        this.mainContent.classList.remove('initial-state');
        this.mainContent.classList.add('discussion-active');
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-flex';
        this.stopBtn.style.display = 'inline-flex';
        this.summarySection.style.display = 'none';
        this.chatContainer.innerHTML = '';
        
        try {
            await this.runDiscussion(topic);
        } catch (error) {
            this.showError(`Discussion failed: ${error.message}`);
            this.stopDiscussion();
        }
    }

    async runDiscussion(topic) {
        const agents = this.getAgentPrompts(topic);
        
        for (let turn = 0; turn < this.maxTurns && this.isDiscussionActive; turn++) {
            this.currentTurn = turn;
            const agentIndex = turn % 2;
            const agent = agents[agentIndex];
            
            // Show typing indicator
            this.showTypingIndicator(agent.name);
            
            // Get conversation context
            const context = this.buildContext(topic, turn, agentIndex);
            
            try {
                // Get AI response
                const response = await this.getAIResponse(context, agent.prompt, agentIndex);
                
                // Remove typing indicator
                this.removeTypingIndicator();
                
                if (!this.isDiscussionActive) break;
                
                // Add message with writing animation
                await this.addMessageWithAnimation(agent.name, response, agentIndex + 1);
                
                // Store message
                this.messages.push({
                    agent: agent.name,
                    content: response,
                    turn: turn + 1
                });
                
            } catch (error) {
                this.removeTypingIndicator();
                throw error;
            }
        }
        
        if (this.isDiscussionActive) {
            await this.generateSummary(topic);
            this.stopDiscussion();
        }
    }

    getAgentPrompts(topic) {
        const baseInstructions = {
            dialog: {
                agent1: `You are participating in a discussion about "${topic}". 

Structure your response as follows:
<thought>
Your detailed reasoning and analysis (2-3 sentences maximum). Consider different perspectives and evidence.
</thought>

<response>
Your main response (1 short paragraph only, 2-3 sentences maximum). Be direct and conversational. Do NOT start with phrases like "Agent 1 has" or "As Agent 1" or reference yourself in third person. Just give your perspective naturally.
</response>`,
                agent2: `You are participating in a discussion about "${topic}". 

Structure your response as follows:
<thought>
Your detailed reasoning and analysis (2-3 sentences maximum). Consider different perspectives and evidence.
</thought>

<response>
Your main response (1 short paragraph only, 2-3 sentences maximum). Be direct and conversational. Do NOT start with phrases like "Agent 2 has" or "As Agent 2" or reference yourself in third person. Just give your perspective naturally.
</response>`
            },
            debate: {
                agent1: `You are the PRO agent in a debate about "${topic}". Your role is to support the position, counter arguments, present evidence, and build momentum. Keep your response to 2-3 sentences maximum. Use confident language like "This approach works because...", "Evidence suggests...". Be sharp and substantive like a skilled debater. Build on previous arguments naturally.`,
                agent2: `You are the CON agent in a debate about "${topic}". Your role is to oppose the position, challenge claims, expose flaws, and question assumptions. Keep your response to 2-3 sentences maximum. Use confident language like "This approach fails because...", "Evidence suggests otherwise...". Be sharp and substantive like a skilled debater. Counter previous arguments directly.`
            },
            brainstorm: {
                agent1: `You are Agent 1 in a brainstorming session about "${topic}". Generate 1-2 NEW creative ideas that haven't been mentioned yet. Keep your response to 2-3 sentences maximum. Start with natural introductory prose, then format ideas with **Bold Titles**. Think outside conventional approaches while remaining practical.`,
                agent2: `You are Agent 2 in a brainstorming session about "${topic}". Generate 1-2 NEW creative ideas that build on or differ from previous suggestions. Keep your response to 2-3 sentences maximum. Start with natural introductory prose, then format ideas with **Bold Titles**. Think outside conventional approaches while remaining practical.`
            },
            prediction: {
                agent1: `You are Agent 1 making an evidence-based prediction about "${topic}". Start with analytical context, then provide your prediction. If the question asks for odds/percentage, format as **Prediction: X%**. If it's open-ended, format as **Prediction: [specific answer]**. Consider multiple variables: trends, historical patterns, external factors. Base your prediction on data points and expert consensus where available.`,
                agent2: `You are Agent 2 making an evidence-based prediction about "${topic}". Start with analytical context, then provide your prediction. If the question asks for odds/percentage, format as **Prediction: X%**. If it's open-ended, format as **Prediction: [specific answer]**. Consider multiple variables: trends, historical patterns, external factors. Base your prediction on data points and expert consensus where available. Your analysis may agree or disagree with the previous prediction.`
            }
        };

        const mode = this.currentMode;
        return [
            { name: 'Agent 1', prompt: baseInstructions[mode].agent1 },
            { name: 'Agent 2', prompt: baseInstructions[mode].agent2 }
        ];
    }

    buildContext(topic, turn, agentIndex) {
        let context = `Topic: ${topic}\n\n`;
        
        if (this.messages.length > 0) {
            context += "Previous conversation:\n";
            this.messages.forEach((msg, index) => {
                context += `${msg.agent}: ${msg.content}\n\n`;
            });
        }
        
        context += `You are responding as ${agentIndex === 0 ? 'Agent 1' : 'Agent 2'} on turn ${turn + 1} of ${this.maxTurns}.`;
        
        if (this.currentMode === 'brainstorm') {
            context += ` Generate NEW ideas that haven't been mentioned yet.`;
        } else if (this.currentMode === 'prediction' && turn === 1) {
            context += ` You may agree or disagree with the previous prediction.`;
        }
        
        return context;
    }

    async getAIResponse(context, systemPrompt, agentIndex) {
        const agentConfig = agentIndex === 0 ? this.settings.agent1 : this.settings.agent2;
        const provider = this.providers[agentConfig.provider];
        const model = agentConfig.model;
        const apiKey = agentConfig.apiKey;
        
        if (agentConfig.provider === 'ollama') {
            return await this.callOllamaAPI(context, systemPrompt, model, agentConfig.baseUrl);
        } else if (agentConfig.provider === 'anthropic') {
            return await this.callAnthropicAPI(context, systemPrompt, model, apiKey);
        } else {
            return await this.callOpenAICompatibleAPI(context, systemPrompt, model, provider.baseUrl, apiKey);
        }
    }

    async callOpenAICompatibleAPI(context, systemPrompt, model, baseUrl, apiKey) {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: context }
                ],
                max_tokens: 1000,
                temperature: 0.8
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async callAnthropicAPI(context, systemPrompt, model, apiKey) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 1000,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: context }
                ],
                temperature: 0.8
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async callOllamaAPI(context, systemPrompt, model, baseUrl) {
        const response = await fetch(`${baseUrl || 'http://localhost:11434'}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                prompt: `${systemPrompt}\n\n${context}`,
                stream: false,
                options: {
                    temperature: 0.8,
                    num_predict: 1000
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    }

    showTypingIndicator(agentName) {
        const typingDiv = document.createElement('div');
        const agentClass = agentName === 'Agent 1' ? 'agent-1' : 'agent-2';
        typingDiv.className = `chat-message typing-message ${agentClass}`;
        typingDiv.innerHTML = `
            <div class="message-header">
                <div class="agent-info">
                    <div class="agent-avatar">${agentName.charAt(agentName.length - 1)}</div>
                    <div class="agent-details">
                        <div class="agent-name">${agentName}</div>
                    </div>
                </div>
            </div>
            <div class="typing-indicator">
                <span>is typing</span>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        this.chatContainer.appendChild(typingDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const typingMessage = this.chatContainer.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    async addMessageWithAnimation(agentName, content, agentNumber) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message agent-${agentNumber}`;
        
        const agentConfig = agentNumber === 1 ? this.settings.agent1 : this.settings.agent2;
        const modelName = agentConfig.model || 'Unknown Model';
        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        
        // Parse thought process and response
        const thoughtMatch = content.match(/<thought>(.*?)<\/thought>/s);
        const responseMatch = content.match(/<response>(.*?)<\/response>/s);
        
        const thoughtContent = thoughtMatch ? thoughtMatch[1].trim() : '';
        const responseContent = responseMatch ? responseMatch[1].trim() : content;
        
        const thoughtSection = thoughtContent ? `
            <div class="thought-section">
                <div class="thought-content">${this.formatMarkdown(thoughtContent)}</div>
            </div>
        ` : '';
        
        const thoughtToggle = thoughtContent ? `
            <button class="thought-toggle" onclick="this.parentElement.querySelector('.thought-section').style.display = this.parentElement.querySelector('.thought-section').style.display === 'block' ? 'none' : 'block'; this.textContent = this.textContent === 'Show thought' ? 'Hide thought' : 'Show thought';">Show thought</button>
        ` : '';
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <div class="agent-info">
                    <div class="agent-avatar">${agentNumber}</div>
                    <div class="agent-details">
                        <div class="agent-name">${agentName}</div>
                        <div class="agent-model">${modelName}</div>
                    </div>
                </div>
                <div class="message-time">${currentTime}</div>
            </div>
            <div class="message-content">
                <div class="message-text"></div>
                ${thoughtSection}
                ${thoughtToggle}
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);
        const messageText = messageDiv.querySelector('.message-text');
        
        // Animate text writing
        await this.typeText(messageText, responseContent);
        
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    async typeText(element, text) {
        // Instant display like ChatGPT - no typing animation
        const formattedText = this.formatMarkdown(text);
        element.innerHTML = formattedText;
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    formatMarkdown(text) {
        // Handle headers
        text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        text = text.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        
        // Handle horizontal rules
        text = text.replace(/^---$/gm, '<hr>');
        
        // Handle bold and italic
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Handle inline code
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Handle lists
        text = text.replace(/^- (.*$)/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        
        // Handle paragraphs
        text = text.replace(/\n\n/g, '</p><p>');
        text = text.replace(/\n/g, '<br>');
        
        // Wrap in paragraph tags
        text = '<p>' + text + '</p>';
        
        // Clean up empty paragraphs and fix nested tags
        text = text.replace(/<p><\/p>/g, '');
        text = text.replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<\/p>/g, '$1');
        text = text.replace(/<p>(<hr>)<\/p>/g, '$1');
        text = text.replace(/<p>(<ul>.*?<\/ul>)<\/p>/gs, '$1');
        
        return text;
    }

    async generateSummary(topic) {
        if (this.messages.length === 0) return;
        
        const summaryPrompts = {
            dialog: `Write a brief 3-sentence summary of this discussion about "${topic}". Focus only on the main conclusion and key insights. Keep it concise and readable.`,
            debate: `Write a brief 3-sentence summary of this debate about "${topic}". State the main arguments from both sides and the key conclusion. Keep it concise.`,
            brainstorm: `Write a brief summary of the best 3-4 ideas from this brainstorming session about "${topic}". List them as bullet points with one line each.`,
            prediction: `Write a brief 2-3 sentence summary of these predictions about "${topic}". Include the key predictions and any consensus or differences.`
        };
        
        const context = this.messages.map(msg => `${msg.agent}: ${msg.content}`).join('\n\n');
        const summaryPrompt = summaryPrompts[this.currentMode];
        
        try {
            const summary = await this.getAIResponse(context, summaryPrompt);
            this.summaryContent.innerHTML = this.formatMarkdown(summary);
            this.summarySection.style.display = 'block';
        } catch (error) {
            console.error('Failed to generate summary:', error);
        }
    }

    pauseDiscussion() {
        this.isDiscussionActive = false;
        this.pauseBtn.style.display = 'none';
        this.startBtn.style.display = 'inline-flex';
        this.startBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
    }

    stopDiscussion() {
        this.isDiscussionActive = false;
        
        // Reset layout to initial state
        this.mainContent.classList.remove('discussion-active');
        this.mainContent.classList.add('initial-state');
        
        this.pauseBtn.style.display = 'none';
        this.stopBtn.style.display = 'none';
        this.startBtn.style.display = 'inline-flex';
        this.startBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        this.removeTypingIndicator();
    }

    // Settings Management
    openSettings() {
        console.log('Opening settings modal');
        console.log('Settings modal element:', this.settingsModal);
        if (this.settingsModal) {
            this.settingsModal.classList.add('active');
            console.log('Added active class to modal');
        } else {
            console.error('Settings modal element not found!');
        }
    }

    closeSettings() {
        this.settingsModal.classList.remove('active');
    }

    async saveSettings() {
        const newSettings = {
            agent1: {
                provider: this.providerAgent1Select?.value || 'openai',
                model: this.modelAgent1Select?.value || 'gpt-3.5-turbo',
                apiKey: this.apiKeyAgent1Input?.value || '',
                baseUrl: this.baseUrlAgent1Input?.value || ''
            },
            agent2: {
                provider: this.providerAgent2Select?.value || 'openai',
                model: this.modelAgent2Select?.value || 'gpt-3.5-turbo',
                apiKey: this.apiKeyAgent2Input?.value || '',
                baseUrl: this.baseUrlAgent2Input?.value || ''
            },
            maxTurns: parseInt(this.maxTurnsInput?.value) || 6
        };

        // Validate settings
        if (!newSettings.agent1.model || !newSettings.agent2.model) {
            this.showError('Please select models for both agents');
            return;
        }

        const provider1 = this.providers[newSettings.agent1.provider];
        const provider2 = this.providers[newSettings.agent2.provider];
        
        if ((provider1.requiresKey && !newSettings.agent1.apiKey) || 
            (provider2.requiresKey && !newSettings.agent2.apiKey)) {
            this.showError('API keys are required for both agents');
            return;
        }

        this.settings = newSettings;
        this.saveSettingsToStorage();
        this.closeSettings();
        this.showSuccess('Settings saved successfully');
    }

    loadSettingsToUI() {
        // Agent 1 settings
        if (this.providerAgent1Select) this.providerAgent1Select.value = this.settings.agent1.provider;
        if (this.modelAgent1Select) this.modelAgent1Select.value = this.settings.agent1.model;
        if (this.apiKeyAgent1Input) this.apiKeyAgent1Input.value = this.settings.agent1.apiKey;
        if (this.baseUrlAgent1Input) this.baseUrlAgent1Input.value = this.settings.agent1.baseUrl;
        
        // Agent 2 settings
        if (this.providerAgent2Select) this.providerAgent2Select.value = this.settings.agent2.provider;
        if (this.modelAgent2Select) this.modelAgent2Select.value = this.settings.agent2.model;
        if (this.apiKeyAgent2Input) this.apiKeyAgent2Input.value = this.settings.agent2.apiKey;
        if (this.baseUrlAgent2Input) this.baseUrlAgent2Input.value = this.settings.agent2.baseUrl;
        
        // General settings
        if (this.maxTurnsInput) this.maxTurnsInput.value = this.settings.maxTurns;

        
        // Load models for both agents
        this.onProviderChange(1);
        this.onProviderChange(2);
    }

    onProviderChange(agentNumber) {
        const providerSelect = agentNumber === 1 ? this.providerAgent1Select : this.providerAgent2Select;
        const baseUrlGroup = agentNumber === 1 ? this.baseUrlAgent1Group : this.baseUrlAgent2Group;
        const baseUrlInput = agentNumber === 1 ? this.baseUrlAgent1Input : this.baseUrlAgent2Input;
        
        const provider = this.providers[providerSelect.value];
        const agentConfig = agentNumber === 1 ? this.settings.agent1 : this.settings.agent2;
        
        // Show/hide base URL input
        if (provider.showBaseUrl) {
            baseUrlGroup.style.display = 'block';
            baseUrlInput.value = agentConfig.baseUrl || provider.baseUrl;
        } else {
            baseUrlGroup.style.display = 'none';
        }
        
        // Load models for provider
        this.loadProviderModels(agentNumber);
    }

    async loadProviderModels(agentNumber) {
        const providerSelect = agentNumber === 1 ? this.providerAgent1Select : this.providerAgent2Select;
        const modelSelect = agentNumber === 1 ? this.modelAgent1Select : this.modelAgent2Select;
        
        const providerKey = providerSelect.value;
        const provider = this.providers[providerKey];
        const agentConfig = agentNumber === 1 ? this.settings.agent1 : this.settings.agent2;
        
        modelSelect.innerHTML = '<option value="">Loading models...</option>';
        
        try {
            let models = provider.models;
            
            if (provider.fetchModels) {
                models = await this.fetchModelsFromProvider(providerKey, agentConfig);
            }
            
            modelSelect.innerHTML = '';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
            
            // Restore selected model
            if (agentConfig.model && models.includes(agentConfig.model)) {
                modelSelect.value = agentConfig.model;
            }
            
        } catch (error) {
            modelSelect.innerHTML = '<option value="">Failed to load models</option>';
            console.error('Failed to load models:', error);
        }
    }

    async fetchModelsFromProvider(providerKey, agentConfig) {
        const provider = this.providers[providerKey];
        
        try {
            if (providerKey === 'openrouter') {
                const response = await fetch('https://openrouter.ai/api/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${agentConfig.apiKey}`
                    }
                });
                const data = await response.json();
                return data.data.map(model => model.id);
            } else if (providerKey === 'lmstudio') {
                const baseUrl = agentConfig.baseUrl || provider.baseUrl;
                const response = await fetch(`${baseUrl}/models`);
                const data = await response.json();
                return data.data.map(model => model.id);
            } else if (providerKey === 'ollama') {
                const baseUrl = agentConfig.baseUrl || provider.baseUrl;
                const response = await fetch(`${baseUrl}/tags`);
                const data = await response.json();
                return data.models.map(model => model.name);
            }
        } catch (error) {
            console.error(`Failed to fetch models from ${providerKey}:`, error);
        }
        
        return provider.models;
    }

    validateSettings() {
        console.log('Validating settings:', this.settings);
        // Simplified validation for testing - just check if we have basic settings
        if (!this.settings || !this.settings.agent1 || !this.settings.agent2) {
            console.log('Missing basic settings structure');
            return false;
        }
        
        const agent1Model = this.settings.agent1?.model;
        const agent2Model = this.settings.agent2?.model;
        
        if (!agent1Model || !agent2Model) {
            console.log('Missing models:', { agent1Model, agent2Model });
            return false;
        }
        
        console.log('Settings validation passed');
        return true;
    }

    // Utility Methods
    loadSettings() {
        const defaultSettings = {
            agent1: {
                provider: 'openai',
                model: 'gpt-3.5-turbo',
                apiKey: '',
                baseUrl: ''
            },
            agent2: {
                provider: 'openai',
                model: 'gpt-3.5-turbo',
                apiKey: '',
                baseUrl: ''
            },
            // Temporary compatibility with current HTML
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            apiKeyAgent1: '',
            apiKeyAgent2: '',
            baseUrl: '',
            maxTurns: 6,

        };
        
        try {
            const saved = localStorage.getItem('ai-forum-settings');
            const settings = saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
            
            // Sync old structure with new structure for compatibility
            if (settings.apiKeyAgent1) {
                settings.agent1.apiKey = settings.apiKeyAgent1;
                settings.agent1.provider = settings.provider;
                settings.agent1.model = settings.model;
                settings.agent1.baseUrl = settings.baseUrl;
            }
            if (settings.apiKeyAgent2) {
                settings.agent2.apiKey = settings.apiKeyAgent2;
                settings.agent2.provider = settings.provider;
                settings.agent2.model = settings.model;
                settings.agent2.baseUrl = settings.baseUrl;
            }
            
            return settings;
        } catch {
            return defaultSettings;
        }
    }

    saveSettingsToStorage() {
        localStorage.setItem('ai-forum-settings', JSON.stringify(this.settings));
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        // Simple error display - could be enhanced with a proper notification system
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        // Simple success display - could be enhanced with a proper notification system
        console.log(`Success: ${message}`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIForum();
});
