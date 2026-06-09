// modules/auth.js - Authentication functions
import { state, resetEditStates } from './state.js';
import { api } from './api.js';
import { storage } from './storage.js';
import { showApp, switchTab, showLogin } from './ui.js';

// Use window.renderAll to avoid circular dependency
const doRenderAll = () => { if (typeof window.renderAll === 'function') return window.renderAll(); };

export const hashPassword = async password => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
};

export const checkPermission = (tab, action) => {
    if (!state.currentAdmin) return false;
    if (state.currentAdmin.role === 'super') return true;
    const perms = state.currentAdmin.permissions[tab];
    return perms ? !!perms[action] : false;
};

export const handleLogin = async e => {
    e.preventDefault();
    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!username || !password) {
        const loginErrorEl = document.getElementById('loginError');
        if (loginErrorEl) loginErrorEl.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.';
        return;
    }

    try {
        const result = await api.post('auth/login', { username, password });

        if (!result) {
            // API returned null (network error / 401 handled by api layer)
            const loginErrorEl = document.getElementById('loginError');
            if (loginErrorEl) loginErrorEl.textContent = 'Lỗi kết nối server.';
            return;
        }

        if (result.error) {
            const loginErrorEl = document.getElementById('loginError');
            if (loginErrorEl) loginErrorEl.textContent = result.error;
            return;
        }

        localStorage.setItem('token', result.token);
        sessionStorage.setItem('currentAdmin', JSON.stringify(result.admin));
        state.currentAdmin = result.admin;
        showApp();
        await doRenderAll();
    } catch (err) {
        // API not available - try localStorage fallback
        const admins = JSON.parse(localStorage.getItem('admins') || '[]');

        if (admins.length > 0) {
            const admin = admins.find(a => a.username === username);
            if (admin) {
                const hashedInput = await hashPassword(password);
                if (admin.passwordHash === hashedInput) {
                     state.currentAdmin = admin;
                     storage.useServer = false;
                     sessionStorage.setItem('currentAdmin', JSON.stringify(admin));
                     showApp();
                     await doRenderAll();
                     return;
                 }
            }
            const loginErrorEl = document.getElementById('loginError');
            if (loginErrorEl) loginErrorEl.textContent = 'Sai tên đăng nhập hoặc mật khẩu.';
            return;
        }

        const loginErrorEl = document.getElementById('loginError');
        if (loginErrorEl) loginErrorEl.textContent = 'Lỗi kết nối';
    }
};

export const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('currentAdmin');
    state.currentAdmin = null;
    storage.useServer = false;
    switchTab('students');
    showLogin();
};

export const readPermissionMatrix = () => {
    const permissions = {};
    state.TAB_KEYS.forEach(tab => {
        permissions[tab] = { view: false, add: false, edit: false, delete: false };
    });
    document.querySelectorAll('#permissionMatrix input[type="checkbox"]').forEach(cb => {
        const tab = cb.dataset.tab;
        const action = cb.dataset.action;
        if (permissions[tab]) {
            permissions[tab][action] = cb.checked;
        }
    });
    return permissions;
};

export const setPermissionMatrix = permissions => {
    document.querySelectorAll('#permissionMatrix input[type="checkbox"]').forEach(cb => {
        const tab = cb.dataset.tab;
        const action = cb.dataset.action;
        cb.checked = permissions[tab] ? !!permissions[tab][action] : false;
    });
};

export const resetPermissionMatrix = () => {
    document.querySelectorAll('#permissionMatrix input[type="checkbox"]').forEach(cb => {
        cb.checked = cb.dataset.action === 'view';
    });
};

let changePasswordAdminId = null;

export const openChangePassword = id => {
    if (!state.currentAdmin || state.currentAdmin.role !== 'super') return;
    const admin = state.admins.find(a => a.id === id);
    if (!admin) return;

    changePasswordAdminId = id;
    const changePasswordInfo = document.getElementById('changePasswordInfo');
    const changePasswordError = document.getElementById('changePasswordError');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const changePasswordModal = document.getElementById('changePasswordModal');

    if (changePasswordInfo) changePasswordInfo.textContent = `Đổi mật khẩu cho: ${admin.name} (${admin.username})`;
    if (changePasswordError) changePasswordError.textContent = '';
    if (newPassword) newPassword.value = '';
    if (confirmPassword) confirmPassword.value = '';
    if (changePasswordModal) changePasswordModal.style.display = 'flex';
};

export const closeChangePassword = () => {
    const changePasswordModal = document.getElementById('changePasswordModal');
    if (changePasswordModal) changePasswordModal.style.display = 'none';
    changePasswordAdminId = null;
};

export const handlePasswordChange = async e => {
    e.preventDefault();
    if (!changePasswordAdminId) return;

    const newPwd = document.getElementById('newPassword')?.value;
    const confirmPwd = document.getElementById('confirmPassword')?.value;
    const changePasswordError = document.getElementById('changePasswordError');

    if (!newPwd || newPwd.length < 4) {
        if (changePasswordError) changePasswordError.textContent = 'Mật khẩu phải có ít nhất 4 ký tự.';
        return;
    }
    if (newPwd !== confirmPwd) {
        if (changePasswordError) changePasswordError.textContent = 'Mật khẩu xác nhận không khớp.';
        return;
    }

    const admin = state.admins.find(a => a.id === changePasswordAdminId);
    if (!admin) return;

    if (storage.useServer) {
        // Use dedicated change-password API endpoint
        try {
            const result = await api.post(`admins/${changePasswordAdminId}/change-password`, { password: newPwd });
            if (!result || result.error) {
                if (changePasswordError) changePasswordError.textContent = result?.error || 'Lỗi đổi mật khẩu.';
                return;
            }
        } catch (err) {
            if (changePasswordError) changePasswordError.textContent = 'Lỗi kết nối server.';
            return;
        }
    }

    // Update locally
    admin.passwordHash = await hashPassword(newPwd);
    if (storage.useServer) {
        // Server already updated via API above; update local state.admins to match
        const idx = state.admins.findIndex(a => a.id === changePasswordAdminId);
        if (idx !== -1) state.admins[idx].passwordHash = admin.passwordHash;
    } else {
        await storage.saveAdmins();
    }

    if (admin.id === state.currentAdmin.id) {
        state.currentAdmin = admin;
        sessionStorage.setItem('currentAdmin', JSON.stringify(admin));
    }

    closeChangePassword();
    alert('Đổi mật khẩu thành công!');
};

// Assign to window for onclick handlers
window.openChangePassword = openChangePassword;
window.closeChangePassword = closeChangePassword;