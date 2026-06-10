// modules/merge-students.js - Merge students functionality
import { state } from './state.js';
import { checkPermission } from './auth.js';
import { storage } from './storage.js';
import { api } from './api.js';
import { escapeHtml } from './utils.js';

// Use window.renderAll to avoid circular dependency
const doRenderAll = () => { if (typeof window.renderAll === 'function') return window.renderAll(); };

// Search students for autocomplete
export const searchStudentsForMerge = query => {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    return state.students
        .filter(s => s.name.toLowerCase().includes(q))
        .slice(0, 10);
};

// Render autocomplete dropdown
export const renderMergeDropdown = (dropdownId, inputId, hiddenId, students) => {
    const dropdown = document.getElementById(dropdownId);
    const input = document.getElementById(inputId);
    const hidden = document.getElementById(hiddenId);

    if (!dropdown || !input) return;

    if (students.length === 0) {
        dropdown.innerHTML = '<div class="autocomplete-item" style="color: var(--text-light);">Không tìm thấy học viên</div>';
        dropdown.style.display = 'block';
        return;
    }

    dropdown.innerHTML = students.map(s => {
        const phone = s.phone ? ` - ${escapeHtml(s.phone)}` : '';
        const email = s.email ? ` - ${escapeHtml(s.email)}` : '';
        return `<div class="autocomplete-item" data-id="${s.id}" data-name="${escapeHtml(s.name)}">
            <strong>${escapeHtml(s.name)}</strong>
            <span class="student-info">${phone}${email}</span>
        </div>`;
    }).join('');

    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.autocomplete-item[data-id]').forEach(item => {
        item.addEventListener('click', () => {
            if (hidden) hidden.value = item.dataset.id;
            if (input) input.value = item.dataset.name;
            dropdown.style.display = 'none';
            updateMergePreview();
        });
    });
};

// Update merge preview
export const updateMergePreview = () => {
    const fromId = document.getElementById('mergeFromStudent')?.value;
    const toId = document.getElementById('mergeToStudent')?.value;
    const info = document.getElementById('mergeInfo');
    const preview = document.getElementById('mergePreview');
    const btn = document.getElementById('mergeStudentBtn');

    if (!fromId || !toId) {
        if (info) info.style.display = 'none';
        if (btn) btn.disabled = true;
        return;
    }

    if (fromId === toId) {
        if (info) {
            info.style.display = 'block';
            if (preview) preview.innerHTML = '<span style="color: var(--danger);">Không thể gộp học viên vào chính mình!</span>';
        }
        if (btn) btn.disabled = true;
        return;
    }

    const fromStudent = state.students.find(s => s.id === fromId);
    const toStudent = state.students.find(s => s.id === toId);

    if (!fromStudent || !toStudent) {
        if (info) info.style.display = 'none';
        if (btn) btn.disabled = true;
        return;
    }

    // Count related data
    const enrollmentsCount = state.enrollments.filter(e => e.studentId === fromId).length;
    const attendancesCount = state.attendances.filter(a => a.studentId === fromId).length;
    const paymentsCount = state.paymentRecords.filter(p => p.studentId === fromId).length;

    if (info && preview) {
        info.style.display = 'block';
        preview.innerHTML = `
            <strong>Sẽ chuyển từ:</strong> ${escapeHtml(fromStudent.name)} (${fromId})<br>
            <strong>Sang:</strong> ${escapeHtml(toStudent.name)} (${toId})<br>
            <strong>Dữ liệu sẽ chuyển:</strong>
            <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                <li>${enrollmentsCount} ghi danh khóa học</li>
                <li>${attendancesCount} bản ghi điểm danh</li>
                <li>${paymentsCount} bản ghi thanh toán</li>
            </ul>
            <strong style="color: var(--danger);">Học viên "${escapeHtml(fromStudent.name)}" sẽ bị xóa sau khi gộp.</strong>
        `;
    }
    if (btn) btn.disabled = false;
};

// Merge students - move all data from fromId to toId, then delete fromId
export const mergeStudents = async () => {
    if (!checkPermission('students', 'edit')) return;

    const fromId = document.getElementById('mergeFromStudent')?.value;
    const toId = document.getElementById('mergeToStudent')?.value;

    if (!fromId || !toId) {
        alert('Vui lòng chọn cả hai học viên.');
        return;
    }

    if (fromId === toId) {
        alert('Không thể gộp học viên vào chính mình.');
        return;
    }

    const fromStudent = state.students.find(s => s.id === fromId);
    const toStudent = state.students.find(s => s.id === toId);

    if (!fromStudent || !toStudent) {
        alert('Không tìm thấy học viên.');
        return;
    }

    const confirmMsg = `Gộp "${fromStudent.name}" vào "${toStudent.name}"?\n\n` +
        `Tất cả ghi danh, điểm danh, thanh toán sẽ được chuyển.\n` +
        `Học viên "${fromStudent.name}" sẽ bị XÓA VĨNH VIỄN.\n\n` +
        `Tiếp tục?`;

    if (!confirm(confirmMsg)) return;

    // Transfer enrollments
    state.enrollments
        .filter(e => e.studentId === fromId)
        .forEach(e => { e.studentId = toId; });

    // Transfer attendances
    state.attendances
        .filter(a => a.studentId === fromId)
        .forEach(a => { a.studentId = toId; });

    // Transfer payment records
    state.paymentRecords
        .filter(p => p.studentId === fromId)
        .forEach(p => { p.studentId = toId; });

    // Delete the from student
    state.students = state.students.filter(s => s.id !== fromId);

    if (storage.useServer) {
        // Delete on server (cascades to enrollments/attendances/payment_records)
        await api.delete('students', fromId);
        // Sync transferred records to server
        for (const e of state.enrollments.filter(e => e.studentId === toId)) {
            await api.put('enrollments', e.id, { studentId: e.studentId, courseId: e.courseId, date: e.date, discountType: e.discountType || '', discountValue: e.discountValue || 0 });
        }
        for (const a of state.attendances.filter(a => a.studentId === toId)) {
            await api.put('attendances', a.id, { courseId: a.courseId, studentId: a.studentId, date: a.date, present: a.present });
        }
        for (const p of state.paymentRecords.filter(p => p.studentId === toId)) {
            await api.put('payments', p.id, { studentId: p.studentId, courseId: p.courseId, month: p.month, status: p.status, method: p.method || '' });
        }
        // Sync the target student (in case it's new)
        const toStudentData = state.students.find(s => s.id === toId);
        if (toStudentData) {
            await api.put('students', toId, { name: toStudentData.name, phone: toStudentData.phone, email: toStudentData.email, dob: toStudentData.dob, gender: toStudentData.gender, address: toStudentData.address, status: toStudentData.status });
        }
    } else {
        await storage.saveEnrollments();
        await storage.saveAttendances();
        await storage.savePaymentRecords();
        await storage.saveStudents();
    }

    // Clear form
    document.getElementById('mergeFromSearch').value = '';
    document.getElementById('mergeFromStudent').value = '';
    document.getElementById('mergeToSearch').value = '';
    document.getElementById('mergeToStudent').value = '';
    document.getElementById('mergeFromDropdown').style.display = 'none';
    document.getElementById('mergeToDropdown').style.display = 'none';
    document.getElementById('mergeInfo').style.display = 'none';

    await doRenderAll();
    alert('Gộp học viên thành công!');
};

// Initialize merge section
export const initMergeStudents = () => {
    const fromSearch = document.getElementById('mergeFromSearch');
    const toSearch = document.getElementById('mergeToSearch');
    const swapBtn = document.getElementById('mergeSwapBtn');
    const mergeBtn = document.getElementById('mergeStudentBtn');

    if (fromSearch) {
        fromSearch.addEventListener('input', () => {
            const students = searchStudentsForMerge(fromSearch.value);
            renderMergeDropdown('mergeFromDropdown', 'mergeFromSearch', 'mergeFromStudent', students);
        });
        fromSearch.addEventListener('focus', () => {
            const students = searchStudentsForMerge(fromSearch.value);
            renderMergeDropdown('mergeFromDropdown', 'mergeFromSearch', 'mergeFromStudent', students);
        });
        document.addEventListener('click', e => {
            if (!e.target.closest('#mergeFromSearch') && !e.target.closest('#mergeFromDropdown')) {
                document.getElementById('mergeFromDropdown').style.display = 'none';
            }
        });
    }

    if (toSearch) {
        toSearch.addEventListener('input', () => {
            const students = searchStudentsForMerge(toSearch.value);
            renderMergeDropdown('mergeToDropdown', 'mergeToSearch', 'mergeToStudent', students);
        });
        toSearch.addEventListener('focus', () => {
            const students = searchStudentsForMerge(toSearch.value);
            renderMergeDropdown('mergeToDropdown', 'mergeToSearch', 'mergeToStudent', students);
        });
        document.addEventListener('click', e => {
            if (!e.target.closest('#mergeToSearch') && !e.target.closest('#mergeToDropdown')) {
                document.getElementById('mergeToDropdown').style.display = 'none';
            }
        });
    }

    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            const fromSearch = document.getElementById('mergeFromSearch');
            const fromHidden = document.getElementById('mergeFromStudent');
            const toSearch = document.getElementById('mergeToSearch');
            const toHidden = document.getElementById('mergeToStudent');

            const tempSearch = fromSearch.value;
            const tempHidden = fromHidden.value;

            fromSearch.value = toSearch.value;
            fromHidden.value = toHidden.value;
            toSearch.value = tempSearch;
            toHidden.value = tempHidden;

            document.getElementById('mergeFromDropdown').style.display = 'none';
            document.getElementById('mergeToDropdown').style.display = 'none';
            updateMergePreview();
        });
    }

    if (mergeBtn) {
        mergeBtn.addEventListener('click', mergeStudents);
    }
};