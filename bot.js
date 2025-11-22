const xfBot = (function () {
    'use strict';

    const CHATBOT_CSS = `
   #xfbot-toggle-button{position:fixed;bottom:25px;right:25px;width:60px;height:60px;border-radius:50%;background-color:var(--toggle-bg,#fafafa);box-shadow:0 4px 15px rgba(0,0,0,.3);
       border:none;cursor:pointer;display:flex;justify-content:center;align-items:center;transition:transform .3s ease,opacity .3s ease;
       z-index:1000}#xfbot-toggle-button.is-hidden{transform:scale(.8);opacity:0;pointer-events:none}#xfbot-toggle-button:hover{transform:scale(1.05)}#xfbot-toggle-button svg{width:30px;
           height:30px;fill:var(--header-text-color,#fff)}.xfbot-widget{position:fixed;bottom:25px;right:25px;display:none;flex-direction:column;width:320px;height:480px;
               border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,.2);overflow:hidden;background-color:#f7f7f7;transition:all .3s ease-in-out;z-index:999}.xfbot-widget.is-open{display:flex;transform:translateY(0);opacity:1}
               @media (max-width:480px){.xfbot-widget{width:90vw;height:80vh;bottom:80px;right:5vw;left:5vw}#xfbot-toggle-button{bottom:20px;right:20px}}.xfbot-header{display:flex;
                   align-items:center;background-color:var(--header-bg,#ff6600);color:var(--header-text-color,#fff);padding:10px 15px;border-top-left-radius:10px;border-top-right-radius:10px;user-select:none}.xfbot-header .header-controls{margin-left:auto;display:flex;gap:15px}.xfbot-header-logo{padding:5px;background-color:rgba(255,255,255,.2);border-radius:50%;width:34px;height:34px;display:flex;justify-content:center;align-items:center}.xfbot-header-logo svg{width:24px;height:24px;display:block}.xfbot-header-title{font-weight:600;flex-grow:1;margin-left:10px}.xfbot-header-btn{background:none;border:none;color:var(--header-text-color,#fff);cursor:pointer;opacity:.8;transition:opacity .2s;padding:0;display:flex;align-items:center;justify-content:center}.xfbot-header-btn:hover{opacity:1}.xfbot-body{flex-grow:1;padding:15px;overflow-y:auto;background-color:#e5e5e5;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.2) transparent}.xfbot-body::-webkit-scrollbar{width:8px}.xfbot-body::-webkit-scrollbar-thumb{background-color:rgba(0,0,0,.2);border-radius:4px}.message{display:flex;max-width:85%}.message-bubble{padding:10px 15px;border-radius:20px;line-height:1.4;word-wrap:break-word;overflow-wrap:break-word;font-size:14px;min-width:0}.message-bubble ul{padding-left:20px;margin:5px 0 0}.message-bubble pre{white-space:pre-wrap!important;overflow-wrap:break-word!important;background-color:#f4f4f4;padding:10px;border-radius:5px;margin-top:10px}.user-message{justify-content:flex-end;align-self:flex-end;margin-left:auto}.user-message .message-bubble{background-color:var(--user-bubble-bg,#333);color:var(--user-text-color,#fff);border-bottom-right-radius:5px}.bot-message{justify-content:flex-start;align-self:flex-start}.bot-message .message-bubble{background-color:var(--bot-bubble-bg,#fff);color:var(--bot-text-color,#333);border-bottom-left-radius:5px;box-shadow:0 1px 3px rgba(0,0,0,.1)}.bot-message.is-typing .message-bubble{display:flex;align-items:center;padding:10px 15px;gap:5px}.bot-loader svg circle{animation:pulse 1.4s infinite ease-in-out;transform-origin:center center;fill:var(--bot-text-color,#333)}.bot-loader svg circle:nth-child(2){animation-delay:.2s}.bot-loader svg circle:nth-child(3){animation-delay:.4s}@keyframes pulse{0%,80%,100%{transform:scale(0);opacity:0}40%{transform:scale(1);opacity:1}}.xfbot-footer{display:flex;padding:8px;align-items:center;background-color:#fff;border-top:1px solid #ddd}.xfbot-input{flex-grow:1;padding:10px 15px;border:1px solid #ddd;border-radius:20px;font-size:14px;outline:none;margin-right:6px}.xfbot-send-btn{background:none;border:none;cursor:pointer;padding:0;width:30px;height:30px;display:flex;
       justify-content:center;align-items:center;color:var(--header-bg,#ff6600)}.xfbot-send-btn svg{width:100%;height:100%}
    `;

    function addChatbotStyles() {
        if (!document.getElementById('xfbot-styles')) {
            const style = document.createElement('style');
            style.id = 'xfbot-styles';
            style.textContent = CHATBOT_CSS;
            document.head.appendChild(style);
        }
    }

    let config = {};
    let conversationHistory = [];
    let sessionId = null;
    let hasInteracted = false;

    function simpleRenderer(text) {
        let safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const listItems = [];
        const otherLines = [];
        safeText.split('\n').forEach(line => {
            const match = line.match(/^\s*\*[ \t]+(.*)/);
            if (match) {
                listItems.push(`<li>${match[1]}</li>`);
            } else {
                if (listItems.length > 0) {
                    otherLines.push(`<ul>${listItems.join('')}</ul>`);
                    listItems.length = 0;
                }
                otherLines.push(line);
            }
        });
        if (listItems.length > 0) { otherLines.push(`<ul>${listItems.join('')}</ul>`); }
        safeText = otherLines.join('\n');
        return safeText.replace(/\n/g, '<br>');
    }

    const BOT_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="370" viewBox="0 0 370 400" height="400"><path fill="#fff" fill-opacity="0%" d="M238 422H1.037V1.104h367.8V422zM176.793 69.501c.051.17.103.341-.077 1.423l.193 25.677 2.001.529h19.015l.424-29.735 2.396-1.795c8.201-6.797 10.511-17.365 5.811-26.521-4.565-8.895-15.057-13.641-24.439-11.053-10.591 2.921-16.897 11.823-16.078 22.837.563 7.578 4.795 12.904 10.724 17.63.069.168.139.336.03 1.008M201.5 301.392l54.985-.028c25.666-.194 47.714-9.165 65.883-27.486 25.549-25.763 33.049-64.478 19.065-99.006-13.317-32.879-46.556-55.806-82.241-56.003-47.819-.264-95.642-.338-143.46.008-48.998.354-89.336 41.307-89.614 90.312-.288 50.823 40.47 91.984 91.405 92.181zm-19.903 74.923 79.946-67.185H179.43l.005 62.655c0 .998-.091 2.043.171 2.979.203.725.892 1.313 1.991 1.552z"/><path fill="#3f4047" d="M201 301.392c-28.159-.001-55.819.086-83.478-.021-50.935-.198-91.693-41.358-91.405-92.181.278-49.005 40.615-89.958 89.614-90.312l143.46-.008c35.685.197 68.924 23.124 82.241 56.003 13.984 34.527 6.484 73.242-19.065 99.006-18.169 18.321-40.217 27.292-65.883 27.486l-55.485.028M123.504 144.59c-2.166.003-4.331-.007-6.497.012-36.051.317-65.002 29.408-65.007 65.317-.005 36.144 29.085 65.6 65.261 65.716l140.427-.004c31.105-.101 57.898-22.54 63.843-53.027 7.827-40.135-22.704-77.759-63.599-77.956z"/><path fill="#414248" d="M181.284 376.521c-.786-.444-1.475-1.032-1.678-1.757-.262-.936-.171-1.981-.171-2.979l-.005-62.655h82.113z"/><path fill="#ff0000" d="M176.825 67.951c-5.992-4.184-10.223-9.509-10.787-17.087-.819-11.015 5.488-19.916 16.078-22.837 9.382-2.588 19.874 2.157 24.439 11.053 4.699 9.156 2.389 19.724-5.811 26.521-.767.636-1.596 1.198-2.992 2.113-6.776 3.321-13.069 2.961-19.619.74a5.3 5.3 0 0 0-1.308-.502z"/><g fill="#3f3e44"><path d="M178.335 68.66c6.348 2.015 12.64 2.375 19.205-.69.384 9.519.384 19.1.384 29.16-6.527 0-12.771 0-19.591-.31-.794-.569-1.066-.744-1.393-.833l.109-25.618c.619-.733.8-.986.98-1.411.104-.097.306-.298.306-.298"/><path d="M176.794 68.222c.4-.173.769-.074 1.34.231.202.207 0 .407-.342.486s-.82.059-.82.059c-.069-.168-.139-.336-.177-.776z"/></g><path d="M176.882 69.25c.089-.252.567-.232.805-.213.162.347-.019.6-.522.877-.269-.071-.32-.242-.283-.664m.042 27.044c.342-.218.614-.044.947.432-.244.103-.604-.011-.947-.432" fill="#2f3037"/><path fill="#fefefe" d="m124.003 144.59 133.93.058c40.895.196 71.427 37.82 63.599 77.956-5.946 30.486-32.738 52.926-63.843 53.027l-140.427.004c-36.176-.116-65.266-29.572-65.261-65.716.005-35.91 28.955-65 65.007-65.317zM99.62 214.623c3.234 10.164 11.51 15.943 20.932 14.616 8.935-1.258 15.892-8.722 16.367-17.558.591-10.984-8.103-19.957-19.182-19.801-11.571.164-19.326 9.445-18.117 22.743m158.806 14.687c9.656-1.046 15.961-6.502 17.785-15.388 1.562-7.61-2.477-16.078-9.438-19.788-6.825-3.638-15.24-2.852-21.076 1.968-5.915 4.885-8.169 12.819-5.762 20.282 2.541 7.878 8.495 12.251 18.49 12.927m-52.541 2.949c1.81-7.356 1.157-8.23-6.216-8.239-8.301-.009-16.602-.032-24.903.009-5.36.026-6.493 1.484-5.351 6.661 1.747 7.921 8.655 14.052 16.758 14.874 8.263.839 15.453-3.79 19.712-13.305"/><path fill="#059fff" d="M99.51 214.224c-1.1-12.898 6.655-22.18 18.226-22.343 11.08-.157 19.773 8.817 19.182 19.801-.475 8.836-7.433 16.3-16.367 17.558-9.422 1.327-17.699-4.452-21.041-15.015z"/><path fill="#049eff" d="M257.98 229.311c-9.551-.677-15.505-5.051-18.046-12.928-2.407-7.463-.154-15.397 5.762-20.282 5.836-4.82 14.25-5.605 21.076-1.968 6.962 3.71 11 12.178 9.438 19.788-1.824 8.887-8.129 14.342-18.229 15.39z"/><path fill="#07a0ff" d="M205.778 232.634c-4.154 9.14-11.344 13.769-19.607 12.93-8.103-.823-15.01-6.953-16.758-14.874-1.142-5.176-.01-6.634 5.351-6.661l24.903-.009c7.373.008 8.027.883 6.111 8.613z"/></svg>
`;

    const BOT_LOADER_SVG = `
        <div class="bot-loader">
            <svg width="30" height="15" viewBox="0 0 30 15" xmlns="http://www.w3.org/2000/svg">
                <circle cx="5" cy="7.5" r="5" /><circle cx="15" cy="7.5" r="5" /><circle cx="25" cy="7.5" r="5" />
            </svg>
        </div>
    `;

    const ICON_CLEAR = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `;

    const ICON_MINIMIZE = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    `;

    const ICON_SEND = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
    `;

    function hexToRgba(hex, alpha = 1) {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; }
            c = '0x' + c.join('');
            return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
        }
        return hex;
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function saveState() {
        localStorage.setItem('xfbotSessionId', sessionId);
        localStorage.setItem('xfbotHistory', JSON.stringify(conversationHistory));
    }

    function loadState() {
        const savedSessionId = localStorage.getItem('xfbotSessionId');
        const savedHistory = localStorage.getItem('xfbotHistory');
        if (savedSessionId && savedHistory) {
            try {
                return { sessionId: savedSessionId, history: JSON.parse(savedHistory) };
            } catch (e) {
                console.error("Failed to parse localStorage history", e);
                return null;
            }
        }
        return null;
    }

    function clearChat() {
        // Trigger the transcript email in the background without waiting
        sendTranscriptOnClick();

        // Immediately clear the UI and local storage
        localStorage.removeItem('xfbotHistory');
        conversationHistory = [];
        const chatBody = document.querySelector('.xfbot-body');
        chatBody.innerHTML = '';
        appendMessage(config.initialMessage, 'bot');
    }

    async function sendMessageToAPI(message) {
        const payload = { uid: config.userId, qry: message, messages: conversationHistory, session: sessionId };
        try {
            const response = await fetch(config.apiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) { throw new Error(`API error: ${response.statusText}`); }
            const data = await response.json();
            if (data && data.messages) {
                conversationHistory = data.messages;
                saveState();
            } else {
                throw new Error('API response did not contain a messages array.');
            }
            const lastMessage = conversationHistory[conversationHistory.length - 1];
            return lastMessage.content;
        } catch (error) {
            console.error('Error fetching from API:', error);
            return 'I am sorry, I am currently unable to connect to the service.';
        }
    }

    async function sendTranscriptOnClick() {
        if (conversationHistory.length === 0) return;
        const transcriptHistory = [...conversationHistory, { role: 'user', content: '#send_transcript' }];
        const payload = { uid: config.userId, qry: '#send_transcript', messages: transcriptHistory, session: sessionId };
        try {
            await fetch(config.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true
            });
            console.log("Transcript sent successfully.");
        } catch (error) {
            console.error('Error sending transcript:', error);
        }
    }

    function sendTranscriptOnUnload() {
        if (conversationHistory.length === 0 || !hasInteracted) return;
        const transcriptHistory = [...conversationHistory, { role: 'user', content: '#send_transcript' }];
        const payload = { uid: config.userId, qry: '#send_transcript', messages: transcriptHistory, session: sessionId };
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(config.apiEndpoint, blob);
    }

    function appendMessage(text, sender, doNotScroll = false) {
        const chatBody = document.querySelector('.xfbot-body');
        if (!chatBody) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('message-bubble');
        bubbleDiv.innerHTML = simpleRenderer(text);
        messageDiv.appendChild(bubbleDiv);
        chatBody.appendChild(messageDiv);
        if (!doNotScroll) { chatBody.scrollTop = chatBody.scrollHeight; }
    }

    function appendLoader() {
        const chatBody = document.querySelector('.xfbot-body');
        if (!chatBody) return;
        const loaderDiv = document.createElement('div');
        loaderDiv.classList.add('message', 'bot-message', 'is-typing');
        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('message-bubble');
        bubbleDiv.innerHTML = config.svgLoader;
        loaderDiv.appendChild(bubbleDiv);
        chatBody.appendChild(loaderDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function renderToggleButton() {
        const toggleContainer = document.getElementById('xfbot-toggle-container');
        if (!toggleContainer) { console.error('Toggle button container not found!'); return; }
        const toggleButton = document.createElement('button');
        toggleButton.id = 'xfbot-toggle-button';
        toggleButton.innerHTML = config.svgLogo;
        const bgColor = hexToRgba(config.toggleButtonBgColor, config.toggleButtonOpacity);
        toggleButton.style.setProperty('--toggle-bg', bgColor);
        toggleButton.style.setProperty('--header-text-color', config.headerTextColor);
        toggleContainer.appendChild(toggleButton);
        const widget = document.querySelector('.xfbot-widget');
        toggleButton.addEventListener('click', () => {
            if (widget) {
                widget.classList.add('is-open');
                toggleButton.classList.add('is-hidden');
            }
        });
    }

    function renderChatbotUI() {
        const container = document.getElementById('xfbot-container');
        if (!container) { console.error('Chatbot container element not found!'); return; }

        container.innerHTML = `
            <div class="xfbot-widget" style="--header-bg: ${config.headerBgColor}; --header-text-color: ${config.headerTextColor}; --user-bubble-bg: ${config.chatBubbleUserColor}; --bot-bubble-bg: ${config.chatBubbleBotColor}; --user-text-color: ${config.chatTextColorUser}; --bot-text-color: ${config.chatTextColorBot};">
                <div class="xfbot-header">
                    <div class="xfbot-header-logo">${config.svgLogo}</div>
                    <div class="xfbot-header-title">${config.headerTitle}</div>
                    <div class="header-controls">
                        <button id="xfbot-clear-btn" class="xfbot-header-btn" title="Clear Chat">${config.svgClear}</button>
                        <button id="xfbot-minimize-btn" class="xfbot-header-btn" title="Minimize">${config.svgMinimize}</button>
                    </div>
                </div>
                <div class="xfbot-body"></div>
                <div class="xfbot-footer">
                    <input type="text" class="xfbot-input" placeholder="${config.inputPlaceholder}">
                    <button class="xfbot-send-btn">
                        ${config.svgSend}
                    </button>
                </div>
            </div>`;

        const input = container.querySelector('.xfbot-input');
        const sendButton = container.querySelector('.xfbot-send-btn');
        const clearButton = container.querySelector('#xfbot-clear-btn');
        const minimizeButton = container.querySelector('#xfbot-minimize-btn');
        const chatBody = container.querySelector('.xfbot-body');
        const widget = container.querySelector('.xfbot-widget');

        const handleSendMessage = async () => {
            const message = input.value.trim();
            if (message) {
                hasInteracted = true;
                appendMessage(message, 'user');
                input.value = '';
                input.disabled = true;
                appendLoader();
                try {
                    await sendMessageToAPI(message);
                    const loaders = chatBody.querySelectorAll('.bot-message.is-typing');
                    if (loaders.length > 0) { loaders[loaders.length - 1].remove(); }
                    chatBody.innerHTML = '';
                    conversationHistory.forEach(msg => {
                        const role = msg.role === 'assistant' ? 'bot' : msg.role;
                        appendMessage(msg.content, role, true);
                    });
                } catch (error) {
                    const loaders = chatBody.querySelectorAll('.bot-message.is-typing');
                    if (loaders.length > 0) { loaders[loaders.length - 1].remove(); }
                    appendMessage('I am sorry, I am currently unable to connect to the service.', 'bot');
                    console.error('Error in handleSendMessage:', error);
                }
                input.disabled = false;
                input.focus();
            }
        };

        sendButton.addEventListener('click', handleSendMessage);
        input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') { event.preventDefault(); handleSendMessage(); }
        });
        clearButton.addEventListener('click', clearChat);

        minimizeButton.addEventListener('click', () => {
            const toggleButton = document.getElementById('xfbot-toggle-button');
            if (widget && toggleButton) {
                widget.classList.remove('is-open');
                toggleButton.classList.remove('is-hidden');
            }
        });
    }

    function init() {
        const defaultConfig = {
            apiEndpoint: 'https://xf.com.mt/repliii/bot/',
            userId: 'botdemo',
            headerTitle: 'xfBot',
            headerBgColor: '#ffbf00',
            toggleButtonBgColor: '#ffbf00',
            toggleButtonOpacity: 1,
            headerTextColor: '#fff',
            chatBubbleUserColor: '#333333',
            chatBubbleBotColor: '#ffffff',
            chatTextColorUser: '#ffffff',
            chatTextColorBot: '#333333',
            inputPlaceholder: 'Type your message...',
            svgLogo: BOT_LOGO_SVG,
            svgLoader: BOT_LOADER_SVG,
            svgClear: ICON_CLEAR,
            svgMinimize: ICON_MINIMIZE,
            svgSend: ICON_SEND
        };

        if (typeof xfbotConfig !== 'undefined' && typeof xfbotConfig === 'object') {
            config = { ...defaultConfig, ...xfbotConfig };
        } else {
            config = defaultConfig;
        }

        // --- MODIFICATION: Ensure SVGs fallback if user provides an empty string ---
        config.svgLogo = config.svgLogo || defaultConfig.svgLogo;
        config.svgLoader = config.svgLoader || defaultConfig.svgLoader;
        config.svgClear = config.svgClear || defaultConfig.svgClear;
        config.svgMinimize = config.svgMinimize || defaultConfig.svgMinimize;
        config.svgSend = config.svgSend || defaultConfig.svgSend;

        if (!config.userId) { console.error('Chatbot initialization failed: userId required.'); return; }
        addChatbotStyles();

        if (!document.getElementById('xfbot-container')) {
            const container = document.createElement('div');
            container.id = 'xfbot-container';
            document.body.appendChild(container);
        }
        if (!document.getElementById('xfbot-toggle-container')) {
            const toggleContainer = document.createElement('div');
            toggleContainer.id = 'xfbot-toggle-container';
            document.body.appendChild(toggleContainer);
        }

        config.initialMessage = 'What can I help you with?';
        const savedState = loadState();
        if (savedState) {
            sessionId = savedState.sessionId;
            conversationHistory = savedState.history;
        } else {
            sessionId = generateUUID();
            conversationHistory = [];
        }
        renderChatbotUI();
        const chatBody = document.querySelector('.xfbot-body');
        if (conversationHistory.length > 0) {
            conversationHistory.forEach(msg => {
                const role = msg.role === 'assistant' ? 'bot' : msg.role;
                appendMessage(msg.content, role);
            });
        } else {
            appendMessage(config.initialMessage, 'bot');
        }
        renderToggleButton();

        window.addEventListener('beforeunload', sendTranscriptOnUnload);
    }
    return { init: init };
})();

document.addEventListener('DOMContentLoaded', () => {
    xfBot.init();
});
