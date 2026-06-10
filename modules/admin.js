// modules/admin.js - Admin CRUD functions
import { state } from './state.js';
import { checkPermission, readPermissionMatrix, setPermissionMatrix, resetPermissionMatrix } from './auth.js';
import { storage } from './storage.js';
import { api } from './api.js';
import { escapeHtml } from './utils.js';

export const renderAdminTable = () => {
    const tableBody = document.getElementById('adminTableBody');
    const emptyMessage = document.getElementById('adminEmptyMessage');

    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (state.admins.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }

    if (emptyMessage) emptyMessage.style.display = 'none';

    state.admins.forEach(admin => {
        const tr = document.createElement('tr');
        const permTags = [];
        
        state.TAB_KEYS.forEach(tab => {
            const p = admin.permissions[tab];
            if (!p) return;
            if (p.view) permTags.push(`<span class="permission-tag perm-view">${state.TAB_LABELS[tab]}: Xem</span>`);
            if (p.add) permTags.push(`<span class="permission-tag perm-add">${state.TAB_LABELS[tab]}: Thêm</span>`);
            if (p.edit) permTags.push(`<span class="permission-tag perm-edit">${state.TAB_LABELS[tab]}: Sửa</span>`);
            if (p.delete) permTags.push(`<span class="permission-tag perm-delete">${state.TAB_LABELS[tab]}: Xóa</span>`);
        });

        const isSelf = admin.id === state.currentAdmin?.id;
        const roleLabel = admin.role === 'super' ? 'Super Admin' : 'Quản Trị Viên';
        const canChangePassword = state.currentAdmin?.role === 'super';

        tr.innerHTML = `
            <td>${escapeHtml(admin.username)}</td>
            <td>${escapeHtml(admin.name)}</td>
            <td><span class="status-badge ${admin.role === 'super' ? 'status-active' : 'status-open'}">${escapeHtml(roleLabel)}</span></td>
            <td><div class="permission-tags">${permTags.join('')}</div></td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-secondary" onclick="startAdminEdit('${admin.id}')">Sửa</button>
                ${canChangePassword ? `<button class="btn btn-sm btn-accent" onclick="openChangePassword('${admin.id}')">Đổi MK</button>` : ''}
                ${!isSelf ? `<button class="btn btn-sm btn-danger" onclick="deleteAdmin('${admin.id}')">Xóa</button>` : ''}
            </td>
        `;
        tableBody.appendChild(tr);
    });
};

export const startAdminEdit = id => {
    const admin = state.admins.find(a => a.id === id);
    if (!admin) return;

    state.editingAdminId = id;
    
    const adminFormTitle = document.getElementById('adminFormTitle');
    const adminSubmitBtn = document.getElementById('adminSubmitBtn');
    const adminCancelBtn = document.getElementById('adminCancelBtn');
    const adminPassword = document.getElementById('adminPassword');

    if (adminFormTitle) adminFormTitle.textContent = 'Sửa Quản Trị Viên';
    if (adminSubmitBtn) adminSubmitBtn.textContent = 'Cập Nhật';
    if (adminCancelBtn) adminCancelBtn.style.display = 'inline-block';
    if (adminPassword) adminPassword.required = false;
    
    const adminPasswordPlaceholder = document.getElementById('adminPassword');
    if (adminPasswordPlaceholder) adminPasswordPlaceholder.placeholder = 'Để trống nếu không đổi';

    const adminUsername = document.getElementById('adminUsername');
    const adminName = document.getElementById('adminName');
    const adminRole = document.getElementById('adminRole');

    if (adminUsername) adminUsername.value = admin.username;
    if (adminPassword) adminPassword.value = '';
    if (adminName) adminName.value = admin.name;
    if (adminRole) adminRole.value = admin.role;
    
    setPermissionMatrix(admin.permissions);

    const adminForm = document.getElementById('adminForm');
    if (adminForm) adminForm.scrollIntoView({ behavior: 'smooth' });
};

export const cancelAdminEdit = () => {
    state.editingAdminId = null;
    
    const adminFormTitle = document.getElementById('adminFormTitle');
    const adminSubmitBtn = document.getElementById('adminSubmitBtn');
    const adminCancelBtn = document.getElementById('adminCancelBtn');
    const adminPassword = document.getElementById('adminPassword');

    if (adminFormTitle) adminFormTitle.textContent = 'Thêm Người Quản Trị';
    if (adminSubmitBtn) adminSubmitBtn.textContent = 'Thêm Quản Trị Viên';
    if (adminCancelBtn) adminCancelBtn.style.display = 'none';
    if (adminPassword) {
        adminPassword.required = true;
        adminPassword.placeholder = 'Mật khẩu';
    }
    
    const adminForm = document.getElementById('adminForm');
    if (adminForm) adminForm.reset();
    resetPermissionMatrix();
};

export const deleteAdmin = async id => {
    if (id === state.currentAdmin?.id) {
        alert('Không thể xóa tài khoản đang đăng nhập.');
        return;
    }
    if (!confirm('Bạn có chắc muốn xóa quản trị viên này?')) return;

    if (storage.useServer) {
        try {
            const result = await api.delete('admins', id);
            if (!result || result.error) {
                alert('Lỗi xóa admin: ' + (result?.error || 'Lỗi không xác định'));
                return;
            }
        } catch (err) {
            alert('Lỗi kết nối server khi xóa admin. Vui lòng thử lại.');
            console.error('Delete admin error:', err);
            return;
        }
    }

    state.admins = state.admins.filter(a => a.id !== id);
    if (!storage.useServer) {
        await storage.saveAdmins();
    }
    renderAdminTable();
};

export const handleAdminSubmit = async e => {
    e.preventDefault();
    if (!state.currentAdmin || state.currentAdmin.role !== 'super') {
        alert('Chỉ Super Admin mới có quyền quản lý quản trị viên.');
        return;
    }

    const username = document.getElementById('adminUsername')?.value.trim();
    const password = document.getElementById('adminPassword')?.value;
    const name = document.getElementById('adminName')?.value.trim();
    const role = document.getElementById('adminRole')?.value;
    const permissions = readPermissionMatrix();

    if (!username) { alert('Vui lòng nhập tên đăng nhập.'); return; }
    if (!name) { alert('Vui lòng nhập họ tên.'); return; }

    const isEdit = !!state.editingAdminId;

    if (isEdit) {
        // ===== EDIT EXISTING ADMIN =====
        const index = state.admins.findIndex(a => a.id === state.editingAdminId);
        if (index === -1) return;

        const current = state.admins[index];
        if (state.admins.some(a => a.username === username && a.id !== current.id)) {
            alert('Tên đăng nhập đã tồn tại.'); return;
        }

        const updatedAdmin = {
            ...current, username, name, role, permissions,
            updatedAt: new Date().toISOString()
        };

        if (password && password.length > 0) {
            if (password.length < 4) { alert('Mật khẩu phải có ít nhất 4 ký tự.'); return; }
            const { hashPassword } = await import('./auth.js');
            updatedAdmin.passwordHash = await hashPassword(password);
        }

        if (storage.useServer) {
            try {
                const updateData = {
                    username: updatedAdmin.username,
                    name: updatedAdmin.name,
                    role: updatedAdmin.role,
                    permissions: updatedAdmin.permissions
                };
                if (password && password.length > 0) {
                    updateData.password = password;
                }
                const result = await api.put('admins', updatedAdmin.id, updateData);
                if (!result || result.error) {
                    alert('Lỗi cập nhật admin: ' + (result?.error || 'Lỗi không xác định'));
                    return;
                }
            } catch (err) {
                alert('Lỗi kết nối server khi cập nhật admin. Vui lòng thử lại.');
                console.error('Update admin error:', err);
                return;
            }
        }

        state.admins[index] = updatedAdmin;
        cancelAdminEdit();
        if (!storage.useServer) {
            await storage.saveAdmins();
        }
        renderAdminTable();
        alert('Cập nhật quản trị viên thành công!');
    } else {
        // ===== CREATE NEW ADMIN =====
        if (!password || password.length < 4) { alert('Mật khẩu phải có ít nhất 4 ký tự.'); return; }
        if (state.admins.some(a => a.username === username)) { alert('Tên đăng nhập đã tồn tại.'); return; }

        const { hashPassword } = await import('./auth.js');
        const passwordHash = await hashPassword(password);
        const newId = Date.now().toString();

        // Create on server first
        if (storage.useServer) {
            try {
                const createdAdmin = await api.post('admins', { id: newId, username, name, role, permissions, password });
                if (createdAdmin && createdAdmin.id) {
                    state.admins.push({
                        id: createdAdmin.id,
                        username: createdAdmin.username,
                        name: createdAdmin.name,
                        role: createdAdmin.role,
                        permissions: createdAdmin.permissions || permissions,
                        createdAt: createdAdmin.createdAt || createdAdmin.created_at || new Date().toISOString()
                    });
                } else {
                    state.admins.push({ id: newId, username, name, role, permissions, passwordHash, createdAt: new Date().toISOString() });
                }
                cancelAdminEdit(); renderAdminTable();
                alert('Thêm quản trị viên thành công!');
                return;
            } catch (err) {
                alert('Lỗi tạo admin trên server: ' + (err.message || '')); return;
            }
        }

        // localStorage mode
        state.admins.push({ id: newId, username, name, role, permissions, passwordHash, createdAt: new Date().toISOString() });
        await storage.saveAdmins();
        cancelAdminEdit();
        renderAdminTable();
        alert('Thêm quản trị viên thành công!');
    }
};