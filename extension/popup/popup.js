const API_URL = 'http://localhost:3001';
let domReady = false;

// Listen for token removal (logout from any source) - real-time sync
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.token) {
        if (!changes.token.newValue) {
            // Token removed = logged out
            if (domReady) showScreen('login-screen');
        } else if (changes.token.newValue && !changes.token.oldValue) {
            // Token added = logged in from somewhere else
            if (domReady) loadDashboard(changes.token.newValue);
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    domReady = true;

    // Load saved channel
    const { channel } = await chrome.storage.local.get('channel');
    const channelInput = document.getElementById('channel-input');
    if (channelInput) {
        channelInput.value = channel || 'shuls10';
    }

    // Check if already logged in
    const { token } = await chrome.storage.local.get('token');
    if (token) {
        const success = await loadDashboard(token);
        if (!success) {
            showScreen('login-screen');
        }
    } else {
        // Try to grab token from the web app if user is already logged in there
        const webToken = await tryGetWebToken();
        if (webToken) {
            await chrome.storage.local.set({ token: webToken });
            const success = await loadDashboard(webToken);
            if (!success) showScreen('login-screen');
        } else {
            showScreen('login-screen');
        }
    }

    // Kick OAuth Login
    document.getElementById('login-btn').addEventListener('click', async () => {
        const btn = document.getElementById('login-btn');
        btn.querySelector('span').textContent = 'Conectando...';
        btn.disabled = true;

        try {
            const res = await fetch(`${API_URL}/auth/kick`);
            if (!res.ok) throw new Error('Server error');
            const data = await res.json();
            if (data.url) {
                const newTab = await chrome.tabs.create({ url: data.url });

                // Listen for the callback OR the dashboard page (means login succeeded)
                chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
                    if (tabId !== newTab.id) return;
                    const url = changeInfo.url || '';

                    // Direct callback with token in URL
                    if (url.includes('/auth/callback?token=') || url.includes('token=')) {
                        try {
                            const parsed = new URL(url);
                            const callbackToken = parsed.searchParams.get('token');
                            if (callbackToken) {
                                chrome.storage.local.set({ token: callbackToken });
                                chrome.runtime.sendMessage({ type: 'SET_TOKEN', token: callbackToken });
                                chrome.tabs.remove(tabId).catch(() => {});
                                chrome.tabs.onUpdated.removeListener(listener);
                                loadDashboard(callbackToken);
                                return;
                            }
                        } catch (e) {}
                    }

                    // User landed on dashboard (web app stored token in localStorage)
                    if (url.includes('/dashboard') && changeInfo.status === 'complete') {
                        chrome.scripting.executeScript({
                            target: { tabId },
                            func: () => localStorage.getItem('shuls_token')
                        }).then(results => {
                            const grabbed = results?.[0]?.result;
                            if (grabbed) {
                                chrome.storage.local.set({ token: grabbed });
                                chrome.runtime.sendMessage({ type: 'SET_TOKEN', token: grabbed });
                                chrome.tabs.onUpdated.removeListener(listener);
                                loadDashboard(grabbed);
                            }
                        }).catch(() => {});
                    }
                });
            } else {
                throw new Error('No URL returned');
            }
        } catch (e) {
            btn.querySelector('span').textContent = 'Conectar con Kick';
            btn.disabled = false;
            showError('No se pudo conectar con el servidor. Asegurate que el backend esté corriendo.');
        }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await chrome.storage.local.remove('token');
        chrome.runtime.sendMessage({ type: 'LOGOUT' });
        showScreen('login-screen');
    });

    // Save channel config
    document.getElementById('save-channel-btn')?.addEventListener('click', async () => {
        const input = document.getElementById('channel-input');
        const newChannel = input.value.trim().toLowerCase();
        if (newChannel) {
            await chrome.storage.local.set({ channel: newChannel });
            const btn = document.getElementById('save-channel-btn');
            btn.textContent = '✓ Guardado';
            btn.style.background = 'rgba(82,183,136,0.2)';
            setTimeout(() => {
                btn.textContent = 'Guardar';
                btn.style.background = '';
            }, 2000);
        }
    });
});

// Try to grab token from web app if user already logged in there
async function tryGetWebToken() {
    try {
        // Look for an open web app tab
        const tabs = await chrome.tabs.query({ url: 'http://localhost:5173/*' });
        if (tabs.length === 0) return null;

        const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => localStorage.getItem('shuls_token')
        });

        return results?.[0]?.result || null;
    } catch (e) {
        return null;
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showError(msg) {
    let errEl = document.getElementById('popup-error');
    if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'popup-error';
        errEl.style.cssText = 'padding:8px 12px;margin:8px 12px;background:rgba(255,70,70,0.1);border:1px solid rgba(255,70,70,0.2);border-radius:8px;font-size:10px;color:#ff6b6b;text-align:center;';
        document.querySelector('.app').appendChild(errEl);
    }
    errEl.textContent = msg;
    setTimeout(() => errEl.remove(), 5000);
}

async function loadDashboard(token) {
    try {
        const response = await fetch(`${API_URL}/api/extension/data`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            await chrome.storage.local.remove('token');
            return false;
        }

        const data = await response.json();
        const { user, stream } = data;

        showScreen('dashboard-screen');

        // Avatar
        const avatarEl = document.getElementById('avatar-letter');
        if (user.avatar) {
            avatarEl.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:10px;object-fit:cover;">`;
        } else {
            avatarEl.textContent = (user.displayName || user.kickUsername || 'S')[0].toUpperCase();
        }
        document.getElementById('display-name').textContent = user.displayName || user.kickUsername;
        document.getElementById('points').textContent = user.points.toLocaleString();
        document.getElementById('streak').textContent = user.currentStreak;
        document.getElementById('longest-streak').textContent = user.longestStreak;

        // Show role badge
        if (user.kickRole && user.kickRole !== 'viewer') {
            const badgeDisplay = document.getElementById('badge-display');
            const badgeIcon = document.getElementById('badge-icon');
            const badgeLabel = document.getElementById('badge-label');
            const roleSvgs = {
                broadcaster: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>`,
                moderator: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
                vip: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
                subscriber: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
            };
            const roleColors = { broadcaster: '#C9A84C', moderator: '#5B9DFF', vip: '#A855F7', subscriber: '#52B788' };
            const roleLabels = { broadcaster: 'Broadcaster', moderator: 'Moderador', vip: 'VIP', subscriber: 'Suscriptor' };
            const color = roleColors[user.kickRole] || '#52B788';
            badgeIcon.innerHTML = roleSvgs[user.kickRole] || '';
            badgeIcon.style.cssText = `display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:${color}15;color:${color};border:1px solid ${color}30;`;
            badgeLabel.textContent = roleLabels[user.kickRole] || user.kickRole;
            badgeLabel.style.color = color;
            badgeDisplay.style.display = 'flex';
        }

        // Watch time
        const totalMin = user.totalWatchTime || 0;
        const days = Math.floor(totalMin / 1440);
        const hours = Math.floor((totalMin % 1440) / 60);
        const mins = totalMin % 60;
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        parts.push(`${mins}m`);
        document.getElementById('watch-time').textContent = parts.join(' ');

        // Stream status
        const dot = document.getElementById('live-dot');
        const text = document.getElementById('live-text');
        if (stream.isLive) {
            dot.className = 'status-dot live';
            text.textContent = 'EN VIVO';
            text.style.color = '#52B788';
            document.getElementById('earn-rate').textContent = '+10 pts/min — Acumulando';
            document.getElementById('earn-rate').style.color = '#52B788';
        } else {
            dot.className = 'status-dot';
            text.textContent = 'Offline';
            text.style.color = '#555';
            document.getElementById('earn-rate').textContent = 'Mirá el stream para ganar';
        }

        return true;
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showError('Error conectando con el servidor. ¿Está corriendo el backend?');
        return false;
    }
}
