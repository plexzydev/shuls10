const API_URL = 'http://localhost:3001';

// Heartbeat: enviar cada 1 minuto si el usuario está en el canal configurado
chrome.alarms.create('heartbeat', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'heartbeat') {
        await sendHeartbeat();
    }
});

async function sendHeartbeat() {
    try {
        const { token, channel } = await chrome.storage.local.get(['token', 'channel']);
        if (!token) return;

        const slug = channel || 'shuls10';

        // Verificar si el usuario tiene una pestaña de Kick abierta en el canal
        const tabs = await chrome.tabs.query({ url: `https://kick.com/${slug}*` });
        if (tabs.length === 0) return;

        const response = await fetch(`${API_URL}/api/stream/heartbeat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                chrome.action.setBadgeText({ text: `+${data.pointsEarned}` });
                chrome.action.setBadgeBackgroundColor({ color: '#52B788' });
                setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);

                chrome.storage.local.set({ 
                    points: data.totalPoints,
                    sessionDuration: data.sessionDuration
                });
            }
        }
    } catch (error) {
        // Silenciar errores de red
    }
}

// Mensajes desde popup o content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_TOKEN') {
        chrome.storage.local.get('token', (data) => {
            sendResponse({ token: data.token || null });
        });
        return true;
    }

    if (message.type === 'SET_TOKEN') {
        chrome.storage.local.set({ token: message.token });
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'LOGOUT') {
        // Invalidate token on backend before clearing
        chrome.storage.local.get('token', async (data) => {
            if (data.token) {
                try {
                    await fetch(`${API_URL}/auth/logout`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${data.token}` }
                    });
                } catch (e) {}
            }

            // Clear all local storage
            chrome.storage.local.clear();

            // Broadcast logout to all Kick content scripts
            const kickTabs = await chrome.tabs.query({ url: 'https://kick.com/*' });
            for (const tab of kickTabs) {
                chrome.tabs.sendMessage(tab.id, { type: 'FORCE_LOGOUT' }).catch(() => {});
            }

            // Force logout on web app tabs by clearing their localStorage
            const webTabs = await chrome.tabs.query({ url: 'http://localhost:5173/*' });
            for (const tab of webTabs) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        localStorage.removeItem('shuls_token');
                        window.location.href = '/';
                    }
                }).catch(() => {});
            }
        });
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'GET_USER_DATA') {
        getUserData().then(data => sendResponse(data)).catch(() => sendResponse(null));
        return true;
    }
});

async function getUserData() {
    const { token } = await chrome.storage.local.get('token');
    if (!token) return null;

    const response = await fetch(`${API_URL}/api/extension/data`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
        return await response.json();
    }
    return null;
}
