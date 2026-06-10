// modules/student.js - Student CRUD functions
import { state } from './state.js';
import { checkPermission } from './auth.js';
import { storage } from './storage.js';
import { api } from './api.js';
import { getStudentCourseCount, getStudentCourses, formatDate, getStatusClass, escapeHtml, formatCurrency, formatCourseName, generateId } from './utils.js';

// Use window.renderAll to avoid circular dependency
const doRenderAll = () => { if (typeof window.renderAll === 'function') return window.renderAll(); };

export const handleStudentSubmit = async e => {
    e.preventDefault();

    const isEdit = !!state.editingStudentId;
    if (isEdit && !checkPermission('students', 'edit')) return;
    if (!isEdit && !checkPermission('students', 'add')) return;

    const name = document.getElementById('studentName')?.value.trim();
    const phone = document.getElementById('studentPhone')?.value.trim();
    const email = document.getElementById('studentEmail')?.value.trim();
    const dob = document.getElementById('studentDOB')?.value;
    const gender = document.getElementById('studentGender')?.value;
    const address = document.getElementById('studentAddress')?.value.trim();
    const status = document.getElementById('studentStatus')?.value;

    if (isEdit) {
        const index = state.students.findIndex(s => s.id === state.editingStudentId);
        if (index !== -1) {
            state.students[index] = { ...state.students[index], name, phone, email, dob, gender, address, status };
        }
        if (storage.useServer) {
            await api.put('students', state.editingStudentId, { name, phone, email, dob, gender, address, status });
        }
        cancelStudentEdit();
    } else {
        const newId = 'st_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        state.students.push({
            id: newId,
            name, phone, email, dob, gender, address, status,
            createdAt: new Date().toISOString()
        });
        if (storage.useServer) {
            await api.post('students', { id: newId, name, phone, email, dob, gender, address, status, createdAt: new Date().toISOString() });
        }
    }

    if (!storage.useServer) {
        await storage.saveStudents();
    }
    const studentFormEl = document.getElementById('studentForm');
    if (studentFormEl) studentFormEl.reset();
    await doRenderAll();
};

export const deleteStudent = async id => {
    if (!checkPermission('students', 'delete')) return;
    const courseCount = getStudentCourseCount(id);

    if (courseCount > 0 && !confirm(`Học viên này đang ghi danh ${courseCount} khóa học. Xóa học viên sẽ xóa tất cả ghi danh và điểm danh. Tiếp tục?`)) return;
    if (courseCount === 0 && !confirm('Xóa học viên này?')) return;

    // Delete on server first (cascades to enrollments/attendances/payment_records)
    if (storage.useServer) {
        await api.delete('students', id);
    }

    // Remove from local state only after successful server operation
    state.enrollments = state.enrollments.filter(e => e.studentId !== id);
    state.attendances = state.attendances.filter(a => a.studentId !== id);
    state.paymentRecords = state.paymentRecords.filter(p => p.studentId !== id);
    state.students = state.students.filter(s => s.id !== id);

    if (!storage.useServer) {
        await storage.saveStudents();
        await storage.saveEnrollments();
        await storage.saveAttendances();
        await storage.savePaymentRecords();
    }

    await doRenderAll();
};

export const startStudentEdit = id => {
    const student = state.students.find(s => s.id === id);
    if (!student) return;

    const elements = {
        studentName: document.getElementById('studentName'),
        studentPhone: document.getElementById('studentPhone'),
        studentEmail: document.getElementById('studentEmail'),
        studentDOB: document.getElementById('studentDOB'),
        studentGender: document.getElementById('studentGender'),
        studentAddress: document.getElementById('studentAddress'),
        studentStatus: document.getElementById('studentStatus')
    };

    if (elements.studentName) elements.studentName.value = student.name;
    if (elements.studentPhone) elements.studentPhone.value = student.phone;
    if (elements.studentEmail) elements.studentEmail.value = student.email || '';
    if (elements.studentDOB) elements.studentDOB.value = student.dob || '';
    if (elements.studentGender) elements.studentGender.value = student.gender || '';
    if (elements.studentAddress) elements.studentAddress.value = student.address || '';
    if (elements.studentStatus) elements.studentStatus.value = student.status;

    state.editingStudentId = id;
    const studentFormTitle = document.getElementById('studentFormTitle');
    const studentSubmitBtn = document.getElementById('studentSubmitBtn');
    const studentCancelBtn = document.getElementById('studentCancelBtn');
    
    if (studentFormTitle) studentFormTitle.textContent = 'Sửa Thông Tin Học Viên';
    if (studentSubmitBtn) studentSubmitBtn.textContent = 'Cập Nhật';
    if (studentCancelBtn) studentCancelBtn.style.display = 'inline-block';
    
    const studentForm = document.getElementById('studentForm');
    if (studentForm) studentForm.scrollIntoView({ behavior: 'smooth' });
};

export const cancelStudentEdit = () => {
    state.editingStudentId = null;
    const studentFormTitle = document.getElementById('studentFormTitle');
    const studentSubmitBtn = document.getElementById('studentSubmitBtn');
    const studentCancelBtn = document.getElementById('studentCancelBtn');
    const studentForm = document.getElementById('studentForm');
    
    if (studentFormTitle) studentFormTitle.textContent = 'Thêm Học Viên';
    if (studentSubmitBtn) studentSubmitBtn.textContent = 'Thêm Học Viên';
    if (studentCancelBtn) studentCancelBtn.style.display = 'none';
    if (studentForm) studentForm.reset();
};

export const getFilteredStudents = () => {
    let filtered = [...state.students];
    const searchEl = document.getElementById('studentSearch');
    const statusEl = document.getElementById('studentFilterStatus');
    const courseFilterEl = document.getElementById('studentFilterCourse');
    
    const search = searchEl?.value.toLowerCase() || '';
    const status = statusEl?.value || '';
    const courseFilter = courseFilterEl?.value || '';

    if (search) {
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(search) ||
            s.phone.includes(search)
        );
    }
    if (status) filtered = filtered.filter(s => s.status === status);
    if (courseFilter === 'has_course') {
        filtered = filtered.filter(s => state.enrollments.some(e => e.studentId === s.id));
    } else if (courseFilter === 'no_course') {
        filtered = filtered.filter(s => !state.enrollments.some(e => e.studentId === s.id));
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
};

export const clearStudentFilterInputs = () => {
    const studentSearch = document.getElementById('studentSearch');
    const studentFilterStatus = document.getElementById('studentFilterStatus');
    const studentFilterCourse = document.getElementById('studentFilterCourse');

    if (studentSearch) studentSearch.value = '';
    if (studentFilterStatus) studentFilterStatus.value = '';
    if (studentFilterCourse) studentFilterCourse.value = '';
    renderStudentTable();
};

export const renderStudentTable = () => {
    const filtered = getFilteredStudents();
    const tableBody = document.getElementById('studentTableBody');
    const emptyMessage = document.getElementById('studentEmptyMessage');
    const deleteFilteredStudents = document.getElementById('deleteFilteredStudents');
    
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const hasActiveFilter = document.getElementById('studentSearch')?.value || 
                           document.getElementById('studentFilterStatus')?.value || 
                           document.getElementById('studentFilterCourse')?.value;
    
    if (deleteFilteredStudents) {
        deleteFilteredStudents.style.display = (hasActiveFilter && state.currentAdmin && state.currentAdmin.role === 'super') ? 'inline-block' : 'none';
    }

    if (filtered.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }

    if (emptyMessage) emptyMessage.style.display = 'none';

    filtered.forEach(student => {
        const tr = document.createElement('tr');
        const canEdit = checkPermission('students', 'edit');
        const canDelete = checkPermission('students', 'delete');
        const actions = [`<button class="btn btn-secondary btn-sm" onclick="showStudentDetail('${student.id}')">Chi Tiết</button>`];
        if (canEdit) actions.push(`<button class="btn btn-edit" onclick="startStudentEdit('${student.id}')">Sửa</button>`);
        if (canDelete) actions.push(`<button class="btn btn-danger" onclick="deleteStudent('${student.id}')">Xóa</button>`);

        tr.innerHTML = `
            <td><strong>${escapeHtml(student.name)}</strong></td>
            <td>${escapeHtml(student.phone)}</td>
            <td>${escapeHtml(student.email) || '-'}</td>
            <td>${escapeHtml(student.gender) || '-'}</td>
            <td><span class="status-badge ${getStatusClass(student.status)}">${escapeHtml(student.status)}</span></td>
            <td class="actions-cell">${actions.join('')}</td>
        `;
        tableBody.appendChild(tr);
    });
};

export const showStudentDetail = id => {
    const student = state.students.find(s => s.id === id);
    if (!student) return;

    const studentEnrollments = state.enrollments.filter(e => e.studentId === id);
    const currentMonth = new Date().getMonth() + 1;

    let coursesHTML = '';
    if (studentEnrollments.length === 0) {
        coursesHTML = '<p style="color: var(--text-light); font-style: italic;">Học viên chưa ghi danh khóa học nào.</p>';
    } else {
        coursesHTML = '<div class="course-list">';
        studentEnrollments.forEach(e => {
            const course = state.courses.find(c => c.id === e.courseId);
            if (!course) return;

            const paymentRecord = state.paymentRecords.find(r =>
                r.studentId === id &&
                r.courseId === e.courseId &&
                r.month === String(currentMonth)
            );
            const paymentStatus = paymentRecord ? paymentRecord.status : 'Chưa thanh toán';
            const statusClass = paymentStatus === 'Đã thanh toán' ? 'status-paid' : 'status-unpaid';

            coursesHTML += `
                <div class="course-item">
                    <div>
                        <div class="course-name">${escapeHtml(formatCourseName(course))}</div>
                        <div class="course-month">Giảng viên: ${escapeHtml(course.instructor)} | Học phí/buổi: ${formatCurrency(course.fee)}</div>
                    </div>
                    <span class="${statusClass}">${escapeHtml(paymentStatus)}</span>
                </div>
            `;
        });
        coursesHTML += '</div>';
    }

    const studentDetailBody = document.getElementById('studentDetailBody');
    const studentDetailModal = document.getElementById('studentDetailModal');

    if (studentDetailBody) {
        studentDetailBody.innerHTML = `
            <div class="student-info">
                <p><strong>Họ Tên:</strong> ${escapeHtml(student.name)}</p>
                <p><strong>SĐT:</strong> ${escapeHtml(student.phone) || '-'}</p>
                <p><strong>Email:</strong> ${escapeHtml(student.email) || '-'}</p>
                <p><strong>Ngày Sinh:</strong> ${escapeHtml(student.dob) || '-'}</p>
                <p><strong>Giới Tính:</strong> ${escapeHtml(student.gender) || '-'}</p>
                <p><strong>Địa Chỉ:</strong> ${escapeHtml(student.address) || '-'}</p>
                <p><strong>Trạng Thái:</strong> <span class="status-badge ${getStatusClass(student.status)}">${escapeHtml(student.status)}</span></p>
            </div>
            <h3 style="margin: 1rem 0 0.75rem; color: var(--primary-dark); font-size: 1rem;">Khóa Học Đang Ghi Danh (${studentEnrollments.length})</h3>
            ${coursesHTML}
        `;
    }
    if (studentDetailModal) studentDetailModal.style.display = 'flex';
};

export const closeStudentDetailModal = () => {
    const studentDetailModal = document.getElementById('studentDetailModal');
    if (studentDetailModal) studentDetailModal.style.display = 'none';
};

export const handleDeleteFilteredStudents = async () => {
    if (!state.currentAdmin || state.currentAdmin.role !== 'super') {
        alert('Chỉ Super Admin mới có quyền xóa hàng loạt.');
        return;
    }

    const filtered = getFilteredStudents();
    if (filtered.length === 0) {
        alert('Không có học viên nào trong bộ lọc để xóa.');
        return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa ${filtered.length} học viên theo bộ lọc hiện tại?\nThao tác này sẽ xóa cả ghi danh và điểm danh liên quan.`)) return;

    const idsToDelete = new Set(filtered.map(s => s.id));

    state.enrollments = state.enrollments.filter(e => !idsToDelete.has(e.studentId));
    state.attendances = state.attendances.filter(a => !idsToDelete.has(a.studentId));
    state.paymentRecords = state.paymentRecords.filter(p => !idsToDelete.has(p.studentId));
    state.students = state.students.filter(s => !idsToDelete.has(s.id));

    if (storage.useServer) {
        for (const id of idsToDelete) {
            await api.delete('students', id);
        }
    }

    if (!storage.useServer) {
        await storage.saveStudents();
        await storage.saveEnrollments();
        await storage.saveAttendances();
        await storage.savePaymentRecords();
    }

    await doRenderAll();
    alert(`Đã xóa thành công ${filtered.length} học viên.`);
};