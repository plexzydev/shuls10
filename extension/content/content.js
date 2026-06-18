// Content Script: Floating panel + Chat badges + Chat styling on kick.com
const API_URL = 'http://localhost:3001';

let CHANNEL_SLUG = 'shuls10';
let chatConfig = null;
let badgeData = {};
let badgeRefreshInterval = null;
let chatObserver = null;
let shulsActive = false;
let lastUrl = '';
let panelUserData = null;
let panelStreamData = null;
let currentTab = 'insignias';
let detectedRolesBuffer = {};
let rolesSyncInterval = null;
let messageBuffer = [];
let debugCount = 0;
let giftDropTimer = null;
let giftIsLive = false;
let giftCheckInterval = null;

// SPA navigation detection — Kick changes URL without reloading
(function boot() {
    checkChannel();
    // Poll for URL changes (pushState/replaceState don't fire events reliably)
    setInterval(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            checkChannel();
        }
    }, 500);
})();

function getChannelFromUrl() {
    return window.location.pathname.toLowerCase().replace(/^\//, '').split('/')[0];
}

function checkChannel() {
    lastUrl = window.location.href;
    const channel = getChannelFromUrl();
    if (channel === CHANNEL_SLUG && !shulsActive) {
        activate();
    } else if (channel !== CHANNEL_SLUG && shulsActive) {
        deactivate();
    }
}

async function activate() {
    if (shulsActive) return;
    shulsActive = true;
    console.log('[Shuls Extension] Activada en canal de Shuls');
    injectPanel();

    // Fetch config and badges
    chatConfig = await fetchChatConfig();
    await refreshBadges();

    // Apply chat styling (always, wallpaper is hardcoded)
    applyChatStyling(chatConfig);

    // Inject chat background image at bottom of chatroom
    injectChatBackground();

    // Observe chat for new messages
    observeChat();

    // Refresh badge data every 2 minutes
    badgeRefreshInterval = setInterval(refreshBadges, 120000);

    // Start role detection sync (sends detected roles to backend every 30s)
    startRoleSync();

    // Start falling gift drop system
    startGiftDropSystem();
}

function deactivate() {
    if (!shulsActive) return;
    shulsActive = false;
    console.log('[Shuls Extension] Desactivada — saliste del canal de Shuls');

    // Remove panel
    document.getElementById('shuls-ext-root')?.remove();

    // Remove chat styling
    document.getElementById('shuls-chat-style')?.remove();

    // Remove chat background
    document.querySelectorAll('.shuls-chat-bg').forEach(el => el.remove());

    // Remove all injected badges
    document.querySelectorAll('.shuls-badges-container').forEach(el => el.remove());

    // Remove gift drops
    document.querySelectorAll('.shuls-gift-drop, .shuls-gift-claim').forEach(el => el.remove());

    // Clear processed flags so they get re-processed if we come back
    document.querySelectorAll('[data-shuls-processed]').forEach(el => delete el.dataset.shulsProcessed);

    // Stop intervals
    if (badgeRefreshInterval) { clearInterval(badgeRefreshInterval); badgeRefreshInterval = null; }
    if (rolesSyncInterval) { clearInterval(rolesSyncInterval); rolesSyncInterval = null; }
    if (giftDropTimer) { clearTimeout(giftDropTimer); giftDropTimer = null; }
    if (giftCheckInterval) { clearInterval(giftCheckInterval); giftCheckInterval = null; }

    // Disconnect chat observer
    if (chatObserver) { chatObserver.disconnect(); chatObserver = null; }

    // Reset state
    panelUserData = null;
    panelStreamData = null;
    chatConfig = null;
    badgeData = {};
    debugCount = 0;
    giftIsLive = false;
}

// Show not-logged-in UI in panel
function showPanelLoggedOut() {
    if (!shulsActive) return;
    panelUserData = null;
    panelStreamData = null;
    const tabs = document.getElementById('shuls-tabs');
    const body = document.getElementById('shuls-body');
    if (tabs) tabs.style.display = 'none';
    if (body) {
        body.innerHTML = `
            <div class="shuls-not-logged">
                <div class="shuls-not-logged-icon">🔒</div>
                <p class="shuls-not-logged-text">Iniciá sesión para acumular puntos</p>
                <button class="shuls-cta-btn" id="shuls-login-cta">Iniciar sesión</button>
            </div>
        `;
        document.getElementById('shuls-login-cta')?.addEventListener('click', () => {
            window.open('http://localhost:5173', '_blank');
        });
    }
}

// Listen for FORCE_LOGOUT from background script
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'FORCE_LOGOUT' && shulsActive) {
        showPanelLoggedOut();
    }
});

// Listen for storage changes (token sync)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.token && shulsActive) {
        if (!changes.token.newValue) {
            // Token removed = logged out
            showPanelLoggedOut();
        } else if (changes.token.newValue && !changes.token.oldValue) {
            // Token added = logged in from somewhere else, reload panel
            loadPanel();
        }
    }
});

// Detected roles buffer - sent to backend periodically
// Message tracking buffer - sent to backend every 30s for challenge progress

async function refreshBadges() {
    try {
        const r = await fetch(`${API_URL}/api/extension/chat-badges`);
        if (r.ok) {
            const data = await r.json();
            badgeData = data.badges || {};
            console.log(`[Shuls] Loaded ${Object.keys(badgeData).length} user badges`);
        }
    } catch (e) {}
}

// Send detected roles and messages to backend every 30 seconds
function startRoleSync() {
    rolesSyncInterval = setInterval(async () => {
        // Sync roles
        const entries = Object.entries(detectedRolesBuffer);
        if (entries.length > 0) {
            const detectedRoles = entries.map(([username, role]) => ({ username, role }));
            detectedRolesBuffer = {};
            try {
                await fetch(`${API_URL}/api/extension/chat-roles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ detectedRoles })
                });
                console.log(`[Shuls] Synced ${detectedRoles.length} detected roles to backend`);
            } catch (e) {}
        }

        // Sync messages for challenge progress
        if (messageBuffer.length > 0) {
            const messages = [...messageBuffer];
            messageBuffer = [];
            try {
                await fetch(`${API_URL}/api/extension/chat-messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages })
                });
                console.log(`[Shuls] Synced ${messages.length} messages for challenges`);
            } catch (e) {}
        }
    }, 5000);
}


// ========== CHAT BACKGROUND ==========
function injectChatBackground() {
    function tryInject() {
        if (!shulsActive) return; // Stop retrying if deactivated
        const chatroom = document.querySelector('#chatroom') ||
            document.querySelector('[id*="chatroom"]') ||
            document.querySelector('[class*="chatroom"]');
        if (!chatroom) {
            setTimeout(tryInject, 1000);
            return;
        }
        if (chatroom.querySelector('.shuls-chat-bg')) return;

        const img = document.createElement('img');
        img.className = 'shuls-chat-bg';
        img.src = chrome.runtime.getURL('icons/chat-bg.gif');
        chatroom.appendChild(img);
        console.log('[Shuls] Chat background GIF injected');
    }
    tryInject();
}

// ========== CHAT STYLING ==========
function applyChatStyling(config) {
    const theme = config?.theme || {};
    const style = document.createElement('style');
    style.id = 'shuls-chat-style';
    style.textContent = `
        /* Shuls Chat Background - position chatroom for overlay */
        #chatroom,
        [id*="chatroom"],
        [class*="chatroom"],
        .chatroom {
            position: relative !important;
        }
        .shuls-chat-bg {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 60% !important;
            object-fit: cover !important;
            object-position: center bottom !important;
            opacity: 0.25 !important;
            pointer-events: none !important;
            z-index: 0 !important;
            -webkit-mask-image: linear-gradient(to top, black 0%, black 20%, transparent 100%) !important;
            mask-image: linear-gradient(to top, black 0%, black 20%, transparent 100%) !important;
        }

        /* Subtle top accent border */
        #chatroom,
        [class*="chatroom"] {
            border-top: 2px solid transparent !important;
            border-image: linear-gradient(90deg, transparent, ${theme.primary || '#52B788'}50, ${theme.accent || '#C9A84C'}30, transparent) 1 !important;
        }

        /* Chat message hover effect */
        [class*="chat-entry"]:hover,
        [data-chat-entry]:hover,
        [class*="message"]:hover {
            background: rgba(82,183,136,0.06) !important;
            border-radius: 6px;
        }

        /* Shuls custom badge */
        .shuls-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            border-radius: 5px;
            vertical-align: middle;
            animation: shulsBadgePop 0.3s cubic-bezier(0.16,1,0.3,1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .shuls-badge:hover {
            transform: scale(1.2);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .shuls-badge svg {
            width: 12px;
            height: 12px;
        }
        .shuls-badges-container {
            display: inline-flex !important;
            align-items: center !important;
            gap: 3px !important;
            margin-right: 5px !important;
            vertical-align: middle !important;
        }

        /* Streamer message highlight */
        .shuls-streamer-msg {
            border-left: 3px solid ${theme.accent || '#C9A84C'} !important;
            background: rgba(201,168,76,0.06) !important;
            border-radius: 4px;
            padding-left: 8px !important;
        }

        @keyframes shulsBadgePop {
            0% { opacity: 0; transform: scale(0.7); }
            100% { opacity: 1; transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    console.log('[Shuls] Chat styling injected');
}

// ========== CHAT OBSERVER ==========
function observeChat() {
    // Disconnect previous observer if any
    if (chatObserver) { chatObserver.disconnect(); chatObserver = null; }

    // Observe entire document - pass every new element through processMsg
    chatObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const n of m.addedNodes) {
                if (n.nodeType !== 1) continue;
                processMsg(n);
            }
        }
    });

    chatObserver.observe(document.body, { childList: true, subtree: true });
    console.log('[Shuls] Global chat observer started on document.body');

    // Scan existing messages after delays (chat may already have content)
    setTimeout(() => scanExistingMessages(), 3000);
    setTimeout(() => scanExistingMessages(), 8000);
    setTimeout(() => scanExistingMessages(), 15000);
}

function scanExistingMessages() {
    if (!shulsActive) return;
    // Find all elements that look like chat messages and process them
    const allNodes = document.querySelectorAll('.group.relative, [class*="chat-entry"], [data-chat-entry]');
    let processed = 0;
    allNodes.forEach(node => {
        if (!node.dataset?.shulsProcessed && node.querySelector('span[style*="color"]')) {
            processSingleMsg(node);
            processed++;
        }
    });
    // Also try: find colored spans and walk up to a processable parent
    if (processed === 0) {
        const coloredSpans = document.querySelectorAll('span[style*="color"]');
        const seen = new Set();
        for (const span of coloredSpans) {
            const text = span.textContent?.trim();
            if (!text || text.length < 2 || text.length > 25 || text.includes(' ') || /^\d{1,2}:\d{2}/.test(text)) continue;
            // Walk up max 5 levels to find a div we can process
            let target = span.parentElement;
            for (let i = 0; i < 5 && target; i++) {
                if (target.dataset?.shulsProcessed || seen.has(target)) break;
                if (target.tagName === 'DIV' && target.querySelector('span[style*="color"]')) {
                    seen.add(target);
                    processSingleMsg(target);
                    processed++;
                    break;
                }
                target = target.parentElement;
            }
        }
    }
    if (processed > 0) console.log(`[Shuls] Scanned and processed ${processed} existing chat messages`);
}

function processMsg(node) {
    if (!node || !node.querySelector) return;

    // Kick uses a virtualized list - node might be a container with multiple messages
    // Find all individual message rows within this node
    const messageRows = node.querySelectorAll('.group.relative');
    if (messageRows.length > 0) {
        messageRows.forEach(row => processSingleMsg(row));
        return;
    }

    // Or this node itself might be a message row
    if (node.classList?.contains('group') || node.querySelector('.break-words')) {
        processSingleMsg(node);
    }
}

function processSingleMsg(node) {
    if (!node || node.dataset?.shulsProcessed) return;
    node.dataset.shulsProcessed = 'true';

    // Skip nodes outside the chat area (e.g. points display, nav elements)
    if (node.closest && (node.closest('nav') || node.closest('header') || node.closest('[class*="channel-points"]') || node.closest('[class*="sidebar"]'))) return;

    // In Kick's chat, username is shown as a colored span with font-bold/font-semibold 
    // inside the message div, typically followed by ": " and the message text
    let usernameEl = null;
    let username = '';

    // Strategy 1: Find the chat-message-identity or username wrapper
    usernameEl = node.querySelector('[class*="chat-message-identity"] span[class*="font-bold"]');
    if (!usernameEl) usernameEl = node.querySelector('[class*="chat-message-identity"] span[class*="font-semibold"]');

    // Strategy 2: Find a bold/semibold span with a color style (Kick colors usernames)
    if (!usernameEl) {
        const candidates = node.querySelectorAll('span[class*="font-bold"][style*="color"], span[class*="font-semibold"][style*="color"], button[class*="font-bold"][style*="color"], span.font-bold, span.font-semibold');
        for (const el of candidates) {
            const text = el.textContent?.trim();
            // Username: short text, no spaces, not a timestamp, not purely numeric
            if (text && text.length >= 2 && text.length < 26 && !text.includes(' ') && !/^\d{1,2}:\d{2}$/.test(text) && !/^[\d,.]+$/.test(text)) {
                usernameEl = el;
                break;
            }
        }
    }

    // Strategy 3: Find a clickable username (button or link that triggers user popup)
    if (!usernameEl) {
        const buttons = node.querySelectorAll('button[class*="inline"], button span[style*="color"]');
        for (const btn of buttons) {
            const text = btn.textContent?.trim();
            if (text && text.length >= 2 && text.length < 26 && !text.includes(' ') && !/^\d/.test(text) && !/^[\d,.]+$/.test(text)) {
                usernameEl = btn;
                break;
            }
        }
    }

    // Strategy 4: Look for colored text that appears before a colon or message content
    if (!usernameEl) {
        const allSpans = node.querySelectorAll('span[style*="color"]');
        for (const s of allSpans) {
            const text = s.textContent?.trim();
            const color = s.style?.color;
            // Username spans have a color and contain a short word (the username)
            if (text && text.length >= 2 && text.length < 26 && !text.includes(' ') && color && !/^\d{1,2}:\d{2}$/.test(text) && !/^[\d,.]+$/.test(text)) {
                usernameEl = s;
                break;
            }
        }
    }

    if (!usernameEl) return;

    username = usernameEl.textContent?.trim().toLowerCase().replace(/[:\s]/g, '');
    if (!username || username.length < 2) return;
    // Reject purely numeric strings (e.g. Kick's points counter "210")
    if (/^[\d,.]+$/.test(username)) return;

    // Debug: log first few found usernames
    if (debugCount < 5) {
        debugCount++;
        console.log(`[Shuls] Found username: "${username}" via`, usernameEl.tagName, usernameEl.getAttribute('class')?.substring(0, 40));
    }

    // Track message for challenge progress
    messageBuffer.push({ username });

    // Highlight streamer messages (only once)
    if (username === CHANNEL_SLUG && !node.classList.contains('shuls-streamer-msg')) {
        node.classList.add('shuls-streamer-msg');
        detectedRolesBuffer[username] = 'broadcaster';
        if (!badgeData[username]) badgeData[username] = {};
        badgeData[username].role = 'broadcaster';
    }

    // Detect role from Kick's native badge elements near the username
    const detectedRole = detectRoleNearUsername(node, usernameEl);
    if (detectedRole && username) {
        const rolePriority = { broadcaster: 4, moderator: 3, vip: 2, subscriber: 1 };
        const currentRole = badgeData[username]?.role;
        const currentPri = rolePriority[currentRole] || 0;
        const newPri = rolePriority[detectedRole] || 0;
        // Only set if higher priority (broadcaster > mod > vip > sub)
        if (newPri > currentPri) {
            detectedRolesBuffer[username] = detectedRole;
            if (!badgeData[username]) badgeData[username] = {};
            badgeData[username].role = detectedRole;
        }
        if (debugCount <= 6) {
            console.log(`[Shuls] Detected role "${detectedRole}" for "${username}"`);
        }
    }

    // Inject badges (role, watchtime, custom) if user has any badge data
    const userData = badgeData[username] || {};
    if (userData.role || userData.watchTimeBadge || userData.badges || userData.customBadges) {
        if (!usernameEl.parentElement?.querySelector('.shuls-badges-container')) {
            injectBadges(usernameEl, userData);
        }
    }
}

// Detect role by looking at elements near/before the username element
function detectRoleNearUsername(node, usernameEl) {
    try {
        // Look at the message row for any badge-like elements (images, svgs) that appear BEFORE the username
        // Kick renders mod/vip/sub badges as small icons before the username text
        const parent = usernameEl.parentElement || node;
        
        // Get all images and svgs in the same message row
        const icons = parent.querySelectorAll('img, svg');
        
        // Also check the broader node
        const allIcons = node.querySelectorAll('img[src], svg');
        const combined = new Set([...icons, ...allIcons]);
        
        let highestRole = null;
        const rolePriority = { broadcaster: 4, moderator: 3, vip: 2, subscriber: 1 };

        for (const icon of combined) {
            const src = (icon.getAttribute('src') || '').toLowerCase();
            const alt = (icon.getAttribute('alt') || '').toLowerCase();
            const title = (icon.getAttribute('title') || '').toLowerCase();
            const cls = (icon.getAttribute('class') || '').toLowerCase();
            const ariaLabel = (icon.getAttribute('aria-label') || '').toLowerCase();
            const parentTitle = (icon.parentElement?.getAttribute('title') || '').toLowerCase();
            const parentAria = (icon.parentElement?.getAttribute('aria-label') || '').toLowerCase();
            
            const all = `${src} ${alt} ${title} ${cls} ${ariaLabel} ${parentTitle} ${parentAria}`;

            // Skip avatars/profile pics (larger images)
            if (src.includes('profile') || src.includes('avatar') || icon.width > 30 || icon.height > 30) continue;
            
            let role = null;
            if (all.includes('owner') || all.includes('broadcaster') || all.includes('streamer')) {
                role = 'broadcaster';
            } else if (all.includes('moderator') || all.includes('mod')) {
                role = 'moderator';
            } else if (all.includes('vip')) {
                role = 'vip';
            } else if (all.includes('sub') || all.includes('subscriber')) {
                role = 'subscriber';
            }

            // If no text-based detection, check if it's a small badge icon (Kick uses small green sword for mod, etc)
            // Any small icon (<24px) that's not a profile pic is likely a badge
            if (!role && (icon.tagName === 'svg' || (icon.tagName === 'IMG' && src.includes('badge')))) {
                // Check SVG content for known paths/shapes
                if (icon.tagName === 'svg') {
                    const svgHTML = icon.outerHTML?.toLowerCase() || '';
                    if (svgHTML.includes('m11') || svgHTML.includes('sword') || svgHTML.includes('shield')) {
                        role = 'moderator';
                    }
                }
            }

            if (role && (!highestRole || rolePriority[role] > rolePriority[highestRole])) {
                highestRole = role;
            }
        }

        // Also check for Kick's badge wrapper divs (they often have title/aria-label with the role)
        const wrappers = node.querySelectorAll('[title], [aria-label]');
        for (const w of wrappers) {
            const title = (w.getAttribute('title') || '').toLowerCase();
            const aria = (w.getAttribute('aria-label') || '').toLowerCase();
            const all = `${title} ${aria}`;
            
            let role = null;
            if (all.includes('owner') || all.includes('broadcaster')) role = 'broadcaster';
            else if (all.includes('moderator') || all.includes('mod')) role = 'moderator';
            else if (all.includes('vip')) role = 'vip';
            else if (all.includes('subscriber') || all.includes('sub')) role = 'subscriber';

            if (role && (!highestRole || rolePriority[role] > rolePriority[highestRole])) {
                highestRole = role;
            }
        }

        return highestRole;
    } catch (e) {
        return null;
    }
}

// SVG icons for each role
const ROLE_SVGS = {
    broadcaster: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>`,
    moderator: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    vip: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    subscriber: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
};

const WATCHTIME_SVGS = {
    legend: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 7 9 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 15 7 15 7"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
    loyal: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3l1 6"/><path d="M2 9h20"/></svg>`,
    og: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></svg>`
};

const ROLE_CONFIG = {
    broadcaster: { label: 'Broadcaster', color: '#C9A84C' },
    moderator: { label: 'Moderador', color: '#5B9DFF' },
    vip: { label: 'VIP', color: '#A855F7' },
    subscriber: { label: 'Suscriptor', color: '#52B788' }
};

const CUSTOM_BADGE_SVGS = {
    star: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    crown: 'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z M3 20h18',
    flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
    diamond: 'M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z',
    sword: 'M14.5 17.5L3 6V3h3l11.5 11.5 M13 19l6-6 M16 16l4 4 M19 21l2-2',
    skull: 'M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8z',
    ghost: 'M9 10h.01 M15 10h.01 M12 2a8 8 0 0 0-8 8v12l3-3 2 2 3-3 3 3 2-2 3 3V10a8 8 0 0 0-8-8z',
    rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z',
    music: 'M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    gamepad: 'M6 12H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2 M6 8h12 M12 8v8',
    trophy: 'M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 7 9 7 M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 15 7 15 7 M4 22h16 M18 2H6v7a6 6 0 0 0 12 0V2Z',
    medal: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M8.21 13.89L7 23l5-3 5 3-1.21-9.12',
    flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7',
    bolt: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    gem: 'M6 3h12l4 6-10 13L2 9z M12 22L2 9h20',
    leaf: 'M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 1c1 2 2 4.5 2 8 0 5.5-4.78 11-10 11z',
    sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2',
    moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
    cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
    snowflake: 'M12 2v20 M2 12h20 M4.93 4.93l14.14 14.14 M19.07 4.93L4.93 19.07',
    flower: 'M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12',
    fish: 'M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6-3.56 0-7.56-2.53-8.5-6z',
    bird: 'M16 7h.01 M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20',
    cat: 'M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.1 6.96-.09 2.05 2.13.17 4.1-2 3.83 0 .94-.13 1.86-.39 2.73A6.5 6.5 0 0 1 12 18a6.5 6.5 0 0 1-6.57-6.27',
    dog: 'M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1',
    paw: 'M11.2 2a1.7 1.7 0 0 0-1.58 2.3l.32.96a4.5 4.5 0 0 1-.36 3.58L8 11.5A5.5 5.5 0 0 0 8 18.5h8a5.5 5.5 0 0 0 0-7l-1.58-2.66a4.5 4.5 0 0 1-.36-3.58l.32-.96A1.7 1.7 0 0 0 12.8 2z',
    lightning: 'M6 16l6-12v8h6L12 24v-8H6z',
    crosshair: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 8v8 M8 12h8 M12 2v4 M12 18v4 M2 12h4 M18 12h4',
    glasses: 'M2 12a5 5 0 0 0 5 5h1a3 3 0 0 0 2-1 3 3 0 0 1 4 0 3 3 0 0 0 2 1h1a5 5 0 0 0 5-5V9a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3z',
    headphones: 'M3 18v-6a9 9 0 0 1 18 0v6 M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z',
    mic: 'M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8',
    pizza: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z M12 2l-3 18 M12 2l3 18 M5 9h14',
    coffee: 'M17 8h1a4 4 0 1 1 0 8h-1 M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z M6 2v3 M10 2v3 M14 2v3',
    beer: 'M17 11h1a3 3 0 0 1 0 6h-1 M5 11h12v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-7z M9 7V3 M13 7V3',
    fire: 'M12 2c-2.5 3-5 6-5 9a5 5 0 0 0 10 0c0-3-2.5-6-5-9z',
    alien: 'M12 2C6.5 2 2 7 2 12c0 3 2 6 5 7l2-4h6l2 4c3-1 5-4 5-7 0-5-4.5-10-10-10z M8 11h.01 M16 11h.01',
    robot: 'M4 6h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2 M8 12h.01 M16 12h.01 M10 16h4',
    wizard: 'M12 2l2 7h-4l2-7z M6 22l3-8h6l3 8H6z M9 14l-4 2 M15 14l4 2',
    ninja: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20 M8 12v.01 M16 12v.01',
    pirate: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M8 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z M14 14h-4c0 2 4 2 4 0z',
    dragon: 'M12 2C8 2 4 6 4 10c0 3 2 6 5 8l3 4 3-4c3-2 5-5 5-8 0-4-4-8-8-8z M8 10h.01 M16 10h.01',
    unicorn: 'M12 2l2 5h3l-3 4 1 5-3-2-3 2 1-5-3-4h3l2-5z M12 22v-4',
    controller: 'M6 11h4 M8 9v4 M15 12h.01 M18 10h.01 M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1.105 0 2-.672 2.5-1.5l1.414-2.5h6.172l1.414 2.5c.5.828 1.395 1.5 2.5 1.5a3 3 0 0 0 3-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z',
    tv: 'M2 7h20v13H2V7z M7 2l5 5 5-5',
    clapperboard: 'M2 4h20v4l-20 0V4z M2 8h20v12H2V8z M7 4l-3 4 M13 4l-3 4 M19 4l-3 4',
    popcorn: 'M7 22l-1-10h12l-1 10H7z M5 12a3 3 0 0 1 3-3 3 3 0 0 1 4-2 3 3 0 0 1 4 2 3 3 0 0 1 3 3',
};

const WATCHTIME_CONFIG = [
    { name: 'Legend', minMinutes: 10000, color: '#C9A84C' },
    { name: 'Loyal', minMinutes: 3000, color: '#95D5B2' },
    { name: 'OG', minMinutes: 600, color: '#52B788' }
];

function injectBadges(usernameEl, userData) {
    const container = document.createElement('span');
    container.className = 'shuls-badges-container';
    container.style.cssText = 'display:inline-flex; align-items:center; gap:3px; margin-right:5px; vertical-align:middle;';

    // Determine the single role to show (highest priority only)
    let role = userData.role;
    if (userData.badges && Array.isArray(userData.badges)) {
        const roleBadge = userData.badges.find(b => b.type === 'role');
        if (roleBadge) role = roleBadge.value;
    }

    if (role && ROLE_CONFIG[role]) {
        const cfg = ROLE_CONFIG[role];
        const el = document.createElement('span');
        el.className = 'shuls-badge shuls-badge-role';
        el.style.cssText = `
            display:inline-flex; align-items:center; justify-content:center;
            width:18px; height:18px; border-radius:5px;
            background: ${cfg.color}18; color: ${cfg.color};
            border: 1px solid ${cfg.color}35;
        `;
        el.innerHTML = ROLE_SVGS[role] || '';
        el.title = cfg.label;
        container.appendChild(el);
    }

    // Watch time badge
    let wtBadgeName = userData.watchTimeBadge;
    if (!wtBadgeName && userData.badges) {
        const wtBadge = userData.badges.find(b => b.type === 'watchtime');
        if (wtBadge) wtBadgeName = wtBadge.value;
    }
    if (wtBadgeName) {
        const wtKey = wtBadgeName.toLowerCase();
        const wtCfg = WATCHTIME_CONFIG.find(w => w.name.toLowerCase() === wtKey);
        if (wtCfg) {
            const el = document.createElement('span');
            el.className = 'shuls-badge shuls-badge-wt';
            el.style.cssText = `
                display:inline-flex; align-items:center; justify-content:center;
                width:18px; height:18px; border-radius:5px;
                background: ${wtCfg.color}18; color: ${wtCfg.color};
                border: 1px solid ${wtCfg.color}35;
            `;
            el.innerHTML = WATCHTIME_SVGS[wtKey] || '';
            el.title = `${wtCfg.name} viewer`;
            container.appendChild(el);
        }
    }

    // Custom badges from mod panel
    if (userData.customBadges && userData.customBadges.length > 0) {
        for (const cb of userData.customBadges) {
            const svgPath = CUSTOM_BADGE_SVGS[cb.icon];
            if (!svgPath) continue;
            const el = document.createElement('span');
            el.className = 'shuls-badge shuls-badge-custom';
            el.style.cssText = `
                display:inline-flex; align-items:center; justify-content:center;
                width:18px; height:18px; border-radius:5px;
                background: ${cb.color}18; color: ${cb.color};
                border: 1px solid ${cb.color}35;
            `;
            el.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${cb.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${svgPath}"/></svg>`;
            el.title = cb.name;
            container.appendChild(el);
        }
    }

    if (container.children.length > 0) {
        usernameEl.insertBefore(container, usernameEl.firstChild);
    }
}

// ========== FLOATING PANEL ==========

function injectPanel() {
    const el = document.createElement('div');
    el.id = 'shuls-ext-root';
    el.innerHTML = `
        <div class="shuls-fab" id="shuls-fab"><img src="${chrome.runtime.getURL('icons/points.png')}" alt="S" style="width:100%;height:100%;object-fit:contain;pointer-events:none;" /></div>
        <div class="shuls-panel hidden" id="shuls-panel">
            <div class="shuls-tabs" id="shuls-tabs">
                <button class="shuls-tab active" data-tab="insignias">Insignias</button>
                <button class="shuls-tab" data-tab="puntos">Puntos</button>
                <button class="shuls-tab" data-tab="cuenta">Cuenta</button>
            </div>
            <div class="shuls-panel-body" id="shuls-body">
                <div class="shuls-loader"></div>
            </div>
        </div>
    `;
    document.body.appendChild(el);

    let panelOpen = false;

    // FAB click toggles the panel
    document.getElementById('shuls-fab').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        panelOpen = !panelOpen;
        const panel = document.getElementById('shuls-panel');
        const fab = document.getElementById('shuls-fab');
        
        if (panelOpen && panel && fab) {
            // Dynamically position the panel above the FAB
            const fabRect = fab.getBoundingClientRect();
            panel.style.position = 'fixed';
            panel.style.bottom = `${window.innerHeight - fabRect.top + 10}px`;
            panel.style.left = `${fabRect.left}px`;
            panel.style.zIndex = '999999';
        }
        
        if (panel) panel.classList.toggle('hidden', !panelOpen);
        if (fab) fab.classList.toggle('active', panelOpen);
        if (panelOpen) loadPanel();
    });

    // Tab switching
    document.getElementById('shuls-tabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.shuls-tab');
        if (!tab) return;
        currentTab = tab.dataset.tab;
        document.querySelectorAll('.shuls-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTab();
    });

    // Try to position near the chat input area
    positionFabNearChat();
}

/**
 * Moves the FAB button into Kick's DOM right next to their Points button.
 */
function positionFabNearChat() {
    let attempts = 0;
    const iv = setInterval(() => {
        attempts++;
        if (attempts > 40 || !shulsActive) {
            clearInterval(iv);
            return;
        }

        const chatInput = document.querySelector('#message-input') ||
            document.querySelector('[data-chat-input]') ||
            document.querySelector('#chatroom textarea') ||
            document.querySelector('[class*="chatroom"] textarea');

        if (!chatInput) return;

        const inputRect = chatInput.getBoundingClientRect();
        if (inputRect.width === 0) return;

        // Find buttons that are physically below the top of the chat input
        // Kick places the points/identity button below the textarea on the left
        const allBtns = Array.from(document.querySelectorAll('button')).filter(b => {
            const r = b.getBoundingClientRect();
            // Must be visible, below the top of input, and inside the chat area
            return r.width > 0 && r.top > inputRect.top - 10 && b.closest('[class*="chat"]');
        });

        if (allBtns.length === 0) return;

        // Sort by X coordinate (leftmost first)
        allBtns.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);

        const pointsBtn = allBtns[0];
        const btnContainer = pointsBtn.parentElement;
        
        const fab = document.getElementById('shuls-fab');
        if (!pointsBtn || !btnContainer || !fab) return;

        // If the FAB is already in the right place, do nothing
        if (fab.parentElement === btnContainer) {
            clearInterval(iv);
            return;
        }

        // Style the FAB to match Kick's button size and layout
        fab.style.position = 'relative';
        fab.style.display = 'flex';
        fab.style.alignItems = 'center';
        fab.style.justifyContent = 'center';
        fab.style.width = '32px';
        fab.style.height = '32px';
        fab.style.padding = '4px';
        fab.style.cursor = 'pointer';
        fab.style.borderRadius = '6px';
        fab.style.marginRight = '8px'; // Space between our orb and their points
        fab.style.flexShrink = '0';
        fab.style.bottom = 'auto';
        fab.style.right = 'auto';
        fab.style.left = 'auto';
        
        // Add hover effect
        fab.addEventListener('mouseenter', () => fab.style.background = 'rgba(34,197,94,0.15)');
        fab.addEventListener('mouseleave', () => fab.style.background = 'transparent');

        // Insert our FAB right after Kick's points button
        btnContainer.insertBefore(fab, pointsBtn.nextSibling);

        // Hide original root container so it doesn't block clicks
        const root = document.getElementById('shuls-ext-root');
        if (root) {
            root.style.position = 'fixed';
            root.style.width = '0';
            root.style.height = '0';
            root.style.overflow = 'visible';
            root.style.pointerEvents = 'none'; // Let clicks pass through
        }
        
        // Ensure panel can receive clicks
        const panel = document.getElementById('shuls-panel');
        if (panel) {
            panel.style.pointerEvents = 'auto';
        }

        clearInterval(iv);
        console.log('[Shuls] ✅ Button injected inline next to Kick points');
    }, 800);
}

function formatDetailedTime(totalMinutes) {
    if (!totalMinutes || totalMinutes === 0) return { text: '0m', days: 0, hours: 0, mins: 0 };
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const mins = totalMinutes % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    return { text: parts.join(' ') || '0m', days, hours, mins };
}

async function loadPanel() {
    const body = document.getElementById('shuls-body');
    body.innerHTML = '<div class="shuls-loader"></div>';

    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_USER_DATA' });

        if (!response || !response.user) {
            showPanelLoggedOut();
            return;
        }

        document.getElementById('shuls-tabs').style.display = 'flex';
        panelUserData = response.user;
        panelStreamData = response.stream;
        renderTab();
    } catch (e) {
        body.innerHTML = '<p class="shuls-err">Error cargando</p>';
    }
}

function renderTab() {
    const body = document.getElementById('shuls-body');
    if (!panelUserData) { body.innerHTML = '<p class="shuls-err">Sin datos</p>'; return; }

    if (currentTab === 'insignias') renderInsigniasTab(body);
    else if (currentTab === 'puntos') renderPuntosTab(body);
    else if (currentTab === 'cuenta') renderCuentaTab(body);
}

function renderInsigniasTab(body) {
    const user = panelUserData;
    const pointsIcon = chrome.runtime.getURL('icons/points.png');

    // Vista previa: show username with equipped badges
    const equippedBadges = (user.badges || []).filter(b => b.equipped);
    const badgePreviewHtml = equippedBadges.map(b => {
        const svgPath = CUSTOM_BADGE_SVGS[b.badge?.icon] || '';
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${b.badge?.color || '#52B788'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${svgPath}"/></svg>`;
    }).join('');

    const allBadges = user.badges || [];
    const badgesHtml = allBadges.length > 0 ? allBadges.map(b => {
        const svgPath = CUSTOM_BADGE_SVGS[b.badge?.icon] || '';
        const isEquipped = b.equipped;
        return `
            <div class="shuls-badge-preview">
                <div class="shuls-badge-preview-icon" style="background:${(b.badge?.color || '#52B788')}15; color:${b.badge?.color || '#52B788'}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${b.badge?.color || '#52B788'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${svgPath}"/></svg>
                </div>
                <span class="shuls-badge-preview-name">${b.badge?.name || 'Insignia'}</span>
                <span class="shuls-badge-preview-status" style="background:${isEquipped ? 'rgba(82,183,136,0.1)' : 'rgba(255,255,255,0.05)'}; color:${isEquipped ? '#52B788' : '#71717a'}">${isEquipped ? '✓' : '—'}</span>
            </div>`;
    }).join('') : '<p style="color:#71717a;font-size:11px;text-align:center;padding:16px 0;">Mirá streams y participá en el chat para desbloquear insignias.</p>';

    body.innerHTML = `
        <div style="font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">VISTA PREVIA</div>
        <div style="display:flex;align-items:center;gap:6px;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:14px;">
            ${badgePreviewHtml}
            <span style="font-size:13px;font-weight:700;color:#fff;">${user.displayName || user.kickUsername}</span>
        </div>
        <div style="font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">TUS INSIGNIAS</div>
        ${badgesHtml}
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;">
            <span style="font-size:10px;color:#71717a;">${equippedBadges.length}/${allBadges.length > 0 ? Math.min(allBadges.length, 3) : 3} seleccionadas</span>
            <a href="http://localhost:5173/profile" target="_blank" class="shuls-save-btn" style="width:auto;padding:6px 14px;margin:0;text-decoration:none;text-align:center;">Guardar</a>
        </div>
    `;
}

function renderPuntosTab(body) {
    const user = panelUserData;
    const stream = panelStreamData;
    const pointsIcon = chrome.runtime.getURL('icons/points.png');
    const wt = formatDetailedTime(user.totalWatchTime);
    const pts = user.points || 0;
    const streak = user.currentStreak || 0;
    const totalMin = user.totalWatchTime || 0;

    // XP = total watch time in minutes (1 min watched = 1 XP)
    const xp = totalMin;
    // Level thresholds: level N requires N*60 XP (1 hour per level)
    const level = Math.max(1, Math.floor(xp / 60) + 1);
    const xpForCurrent = (level - 1) * 60;
    const xpForNext = level * 60;
    const progress = xpForNext > xpForCurrent ? Math.min(((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100, 100) : 100;
    const xpRemaining = Math.max(0, xpForNext - xp);

    const wtHours = Math.floor(totalMin / 60);
    const wtDays = Math.floor(wtHours / 24);
    const streakFires = Math.min(streak, 7);

    body.innerHTML = `
        <div style="text-align:center;padding:6px 0 14px;">
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px;">
                <img src="${pointsIcon}" style="width:28px;height:28px;">
                <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">${pts.toLocaleString()}</span>
            </div>
            <div style="font-size:9px;color:#52B788;font-weight:600;letter-spacing:2px;">NIVEL ${level}</div>
            <div style="margin:8px auto 0;width:85%;height:4px;background:#27272a;border-radius:4px;overflow:hidden;">
                <div style="width:${progress}%;height:100%;background:linear-gradient(90deg,#2D6A4F,#52B788);border-radius:4px;transition:width 0.5s;"></div>
            </div>
            <div style="font-size:8px;color:#71717a;margin-top:4px;">${xp} XP — ${xpRemaining} XP para nivel ${level + 1}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
            <div style="background:#1f1f23;border-radius:8px;padding:10px;text-align:center;">
                <div style="font-size:16px;font-weight:800;color:#fff;">${wtDays > 0 ? wtDays + 'd ' : ''}${wt.hours}h</div>
                <div style="font-size:8px;color:#71717a;letter-spacing:1px;margin-top:2px;">WATCHTIME</div>
            </div>
            <div style="background:#1f1f23;border-radius:8px;padding:10px;text-align:center;">
                <div style="font-size:16px;font-weight:800;color:${streak > 0 ? '#f59e0b' : '#fff'};">${streak}</div>
                <div style="font-size:8px;color:#71717a;letter-spacing:1px;margin-top:2px;">RACHA ${'🔥'.repeat(streakFires)}</div>
            </div>
        </div>

        <div style="background:#1f1f23;border-radius:8px;padding:10px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:10px;color:#a1a1aa;font-weight:600;">CÓMO GANAR</span>
                <span style="font-size:9px;color:${stream?.isLive ? '#52B788' : '#71717a'};font-weight:600;">${stream?.isLive ? '● LIVE' : '○ Stream offline'}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:5px;">
                <div style="display:flex;justify-content:space-between;font-size:10px;">
                    <span style="color:#d4d4d8;">Mirar stream</span>
                    <span style="color:#52B788;font-weight:700;">+10 pts / 10 min</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:10px;">
                    <span style="color:#d4d4d8;">Chatear</span>
                    <span style="color:#52B788;font-weight:700;">+0.15 pts / msg</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:10px;">
                    <span style="color:#d4d4d8;">Regalos del chat</span>
                    <span style="color:#52B788;font-weight:700;">+30~50 pts</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:10px;">
                    <span style="color:#d4d4d8;">XP (watchtime)</span>
                    <span style="color:#a78bfa;font-weight:700;">1 min = 1 XP</span>
                </div>
            </div>
        </div>

        ${stream?.isLive ? `
        <div style="text-align:center;padding:6px 10px;background:rgba(82,183,136,0.08);border:1px solid rgba(82,183,136,0.15);border-radius:8px;font-size:10px;color:#52B788;font-weight:600;">
            Acumulando puntos ahora
        </div>` : ''}
    `;
}

function renderCuentaTab(body) {
    const user = panelUserData;
    const stream = panelStreamData;
    const wt = formatDetailedTime(user.totalWatchTime);
    const totalMin = user.totalWatchTime || 0;
    const xp = totalMin;
    const level = Math.max(1, Math.floor(xp / 60) + 1);

    body.innerHTML = `
        <div class="shuls-acct-row">
            <span class="shuls-acct-label">Puntos</span>
            <span class="shuls-acct-value">${user.points?.toLocaleString() || 0}</span>
        </div>
        <div class="shuls-acct-row">
            <span class="shuls-acct-label">XP</span>
            <span class="shuls-acct-value">${xp}</span>
        </div>
        <div class="shuls-acct-row">
            <span class="shuls-acct-label">Nivel</span>
            <span class="shuls-acct-value">${level}</span>
        </div>
        <div class="shuls-acct-row">
            <span class="shuls-acct-label">Watchtime</span>
            <span class="shuls-acct-value">${wt.text || '0m'}</span>
        </div>
        <div class="shuls-acct-row">
            <span class="shuls-acct-label">Racha de Streams</span>
            <span class="shuls-acct-value">${user.currentStreak || 0}</span>
        </div>
        <div style="display:flex;gap:6px;margin-top:12px;">
            <a href="http://localhost:5173/profile" target="_blank" class="shuls-save-btn" style="text-decoration:none;text-align:center;">Ver Perfil</a>
            <a href="http://localhost:5173/rewards" target="_blank" class="shuls-save-btn" style="text-decoration:none;text-align:center;">Rewards</a>
        </div>
    `;
}

async function fetchChatConfig() {
    try {
        const r = await fetch(`${API_URL}/api/extension/chat-config`);
        if (r.ok) return await r.json();
    } catch (e) {}
    return null;
}

// ========== FALLING GIFT DROP ==========

function startGiftDropSystem() {
    // Check stream status every 30s and schedule gift drops when live
    checkAndScheduleGift();
    giftCheckInterval = setInterval(checkAndScheduleGift, 30000);
}

async function checkAndScheduleGift() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_USER_DATA' });
        const wasLive = giftIsLive;
        giftIsLive = response?.stream?.isLive || false;

        if (giftIsLive && !wasLive) {
            console.log('[Shuls] Stream is live — gift drops enabled');
            scheduleNextGift();
        } else if (!giftIsLive && wasLive) {
            console.log('[Shuls] Stream offline — gift drops disabled');
            if (giftDropTimer) { clearTimeout(giftDropTimer); giftDropTimer = null; }
        }
    } catch (e) {}
}

function scheduleNextGift() {
    if (giftDropTimer) clearTimeout(giftDropTimer);
    // Random interval: 3 to 8 minutes
    const delay = (Math.random() * 5 + 3) * 60 * 1000;
    console.log(`[Shuls] Next gift drop in ${(delay / 60000).toFixed(1)} min`);
    giftDropTimer = setTimeout(() => {
        if (giftIsLive) {
            spawnGiftDrop();
            scheduleNextGift();
        }
    }, delay);
}

function spawnGiftDrop() {
    // Find the chat message list area
    const chatContainer = document.querySelector('#chatroom') ||
        document.querySelector('[class*="chat-container"]') ||
        document.querySelector('[data-chat-entry]')?.parentElement?.parentElement;

    if (!chatContainer) return;

    const chatRect = chatContainer.getBoundingClientRect();
    if (chatRect.width < 60 || chatRect.height < 100) return;

    const GIFT_SIZE = 30;
    const gift = document.createElement('div');
    gift.className = 'shuls-gift-drop';
    gift.innerHTML = `<img src="${chrome.runtime.getURL('icons/points.png')}" style="width:${GIFT_SIZE}px;height:${GIFT_SIZE}px;">`;
    document.body.appendChild(gift);

    // Start position: random X within chat, at the very top
    let x = chatRect.left + Math.random() * (chatRect.width - GIFT_SIZE);
    let y = chatRect.top;
    const fallSpeed = 0.6 + Math.random() * 0.4; // px per frame (~60fps)

    // Random horizontal drift: changes direction randomly
    let driftX = (Math.random() - 0.5) * 1.2; // initial sideways speed
    let driftChangeTimer = 0;
    const driftInterval = 60 + Math.floor(Math.random() * 80); // frames before changing drift

    let alive = true;
    gift.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        alive = false;
        gift.remove();
        claimGift();
    });

    function animate() {
        if (!alive || !gift.parentNode) return;

        // Update chat rect in case of scroll/resize
        const cr = chatContainer.getBoundingClientRect();

        // Fall down
        y += fallSpeed;

        // Drift sideways with random direction changes
        driftChangeTimer++;
        if (driftChangeTimer >= driftInterval) {
            driftChangeTimer = 0;
            driftX = (Math.random() - 0.5) * 1.8;
        }
        x += driftX;

        // Bounce off chat walls
        if (x < cr.left) { x = cr.left; driftX = Math.abs(driftX); }
        if (x + GIFT_SIZE > cr.right) { x = cr.right - GIFT_SIZE; driftX = -Math.abs(driftX); }

        // Reached bottom of chat — disappear
        if (y > cr.bottom - GIFT_SIZE) {
            alive = false;
            gift.style.opacity = '0';
            gift.style.transition = 'opacity 0.3s';
            setTimeout(() => { if (gift.parentNode) gift.remove(); }, 300);
            return;
        }

        gift.style.left = x + 'px';
        gift.style.top = y + 'px';

        requestAnimationFrame(animate);
    }

    gift.style.left = x + 'px';
    gift.style.top = y + 'px';
    gift.style.opacity = '0';
    // Fade in
    requestAnimationFrame(() => {
        gift.style.transition = 'opacity 0.4s';
        gift.style.opacity = '1';
        setTimeout(() => {
            gift.style.transition = '';
            animate();
        }, 400);
    });
}

async function claimGift() {
    try {
        const token = await getStoredToken();
        if (!token) return;

        const r = await fetch(`${API_URL}/api/users/gift-claim`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (r.ok) {
            const data = await r.json();
            showGiftClaimed(data.amount);
        }
    } catch (e) {
        console.error('[Shuls] Gift claim error:', e);
    }
}

async function getStoredToken() {
    try {
        const data = await chrome.storage.local.get('token');
        return data.token || null;
    } catch (e) { return null; }
}

function showGiftClaimed(amount) {
    const popup = document.createElement('div');
    popup.className = 'shuls-gift-claim';
    popup.innerHTML = `<span>+${amount} pts</span><small>🎁 ¡Regalo reclamado!</small>`;
    document.body.appendChild(popup);
    setTimeout(() => {
        popup.style.transition = 'opacity 0.5s';
        popup.style.opacity = '0';
        setTimeout(() => popup.remove(), 500);
    }, 2000);
}
