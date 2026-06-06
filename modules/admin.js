// modules/admin.js - Admin CRUD functions
import { state } from './state.js';
import { checkPermission, readPermissionMatrix, setPermissionMatrix, resetPermissionMatrix } from './auth.js';
import { storage } from './storage.js';
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

        tr.innerHTML = `
            <td>${escapeHtml(admin.username)}</td>
            <td>${escapeHtml(admin.name)}</td>
            <td><span class="status-badge ${admin.role === 'super' ? 'status-active' : 'status-open'}">${escapeHtml(roleLabel)}</span></td>
            <td><div class="permission-tags">${permTags.join('')}</div></td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-secondary" onclick="startAdminEdit('${admin.id}')">Sửa</button>
                <button class="btn btn-sm btn-accent" onclick="openChangePassword('${admin.id}')">Đổi MK</button>
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
    
    state.admins = state.admins.filter(a => a.id !== id);
    await storage.saveAdmins();
    renderAdminTable();
};