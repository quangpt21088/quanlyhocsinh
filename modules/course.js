// modules/course.js - Course CRUD functions
import { state } from './state.js';
import { checkPermission, readPermissionMatrix, setPermissionMatrix, resetPermissionMatrix } from './auth.js';
import { storage } from './storage.js';
import { api } from './api.js';
import { getCourseEnrollmentCount, formatCurrency, formatCourseName, getStatusClass, escapeHtml } from './utils.js';

// Use window.renderAll to avoid circular dependency
const doRenderAll = () => { if (typeof window.renderAll === 'function') return window.renderAll(); };

export const handleCourseSubmit = async e => {
    e.preventDefault();

    const isEdit = !!state.editingCourseId;
    if (isEdit && !checkPermission('courses', 'edit')) return;
    if (!isEdit && !checkPermission('courses', 'add')) return;

    const nameEl = document.getElementById('courseName');
    const instructorEl = document.getElementById('courseInstructor');
    const monthEl = document.getElementById('courseMonth');
    const feeEl = document.getElementById('courseFee');
    const maxStudentsEl = document.getElementById('courseMaxStudents');
    const statusEl = document.getElementById('courseStatus');

    const name = nameEl?.value.trim();
    const instructor = instructorEl?.value.trim();
    const monthVal = monthEl?.value;
    const month = monthVal ? parseInt(monthVal) : null;
    const fee = parseFloat(feeEl?.value);
    const maxStudentsVal = maxStudentsEl?.value;
    const maxStudents = maxStudentsVal ? parseInt(maxStudentsVal) : 30;
    const status = statusEl?.value;

    if (!name) {
        alert('Vui lòng nhập tên khóa học.');
        return;
    }
    if (!instructor) {
        alert('Vui lòng nhập tên giảng viên.');
        return;
    }
    if (isNaN(fee) || fee < 0) {
        alert('Học phí không hợp lệ.');
        return;
    }
    if (month && (month < 1 || month > 12)) {
        alert('Tháng không hợp lệ (1-12).');
        return;
    }

    if (isEdit) {
        const index = state.courses.findIndex(c => c.id === state.editingCourseId);
        if (index !== -1) {
            state.courses[index] = { ...state.courses[index], name, instructor, month, fee, maxStudents, status };
        }
        if (storage.useServer) {
            try {
                const result = await api.put('courses', state.editingCourseId, { name, instructor, month, fee, maxStudents, status });
                if (!result || result.error) {
                    alert('Lỗi cập nhật khóa học: ' + (result?.error || 'Lỗi không xác định'));
                    await doRenderAll();
                    return;
                }
            } catch (err) {
                alert('Lỗi kết nối server khi cập nhật khóa học. Vui lòng thử lại.');
                console.error('Update course error:', err);
                return;
            }
        }
        cancelCourseEdit();
    } else {
        const newId = 'co_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const newCourse = {
            id: newId,
            name, instructor, month, fee, maxStudents, status,
            createdAt: new Date().toISOString()
        };
        if (storage.useServer) {
            try {
                const result = await api.post('courses', newCourse);
                if (!result || result.error) {
                    alert('Lỗi tạo khóa học: ' + (result?.error || 'Lỗi không xác định'));
                    await doRenderAll();
                    return;
                }
            } catch (err) {
                alert('Lỗi kết nối server khi tạo khóa học. Vui lòng thử lại.');
                console.error('Create course error:', err);
                return;
            }
        }
        state.courses.push(newCourse);
    }

    if (!storage.useServer) {
        await storage.saveCourses();
    }
    const courseForm = document.getElementById('courseForm');
    if (courseForm) courseForm.reset();
    await doRenderAll();
};

export const deleteCourse = async id => {
    if (!checkPermission('courses', 'delete')) return;
    const enrollCount = state.enrollments.filter(e => e.courseId === id).length;
    
    if (enrollCount > 0 && !confirm(`Khóa học này có ${enrollCount} học viên. Xóa khóa học sẽ xóa tất cả ghi danh và điểm danh. Tiếp tục?`)) return;
    if (enrollCount === 0 && !confirm('Xóa khóa học này?')) return;
    
    // Delete on server first (cascades to enrollments/attendances/payment_records)
    if (storage.useServer) {
        try {
            const result = await api.delete('courses', id);
            if (!result || result.error) {
                alert('Lỗi xóa khóa học: ' + (result?.error || 'Lỗi không xác định'));
                return;
            }
        } catch (err) {
            alert('Lỗi kết nối server khi xóa khóa học. Vui lòng thử lại.');
            console.error('Delete course error:', err);
            return;
        }
    }

    // Remove from local state
    state.enrollments = state.enrollments.filter(e => e.courseId !== id);
    state.attendances = state.attendances.filter(a => a.courseId !== id);
    state.paymentRecords = state.paymentRecords.filter(r => r.courseId !== id);
    state.courses = state.courses.filter(c => c.id !== id);

    if (!storage.useServer) {
        await storage.saveCourses();
        await storage.saveEnrollments();
        await storage.saveAttendances();
        await storage.savePaymentRecords();
    }
    await doRenderAll();
};

export const startCourseEdit = id => {
    const course = state.courses.find(c => c.id === id);
    if (!course) return;

    const nameEl = document.getElementById('courseName');
    const instructorEl = document.getElementById('courseInstructor');
    const monthEl = document.getElementById('courseMonth');
    const feeEl = document.getElementById('courseFee');
    const maxStudentsEl = document.getElementById('courseMaxStudents');
    const statusEl = document.getElementById('courseStatus');

    if (nameEl) nameEl.value = course.name;
    if (instructorEl) instructorEl.value = course.instructor;
    if (monthEl) monthEl.value = course.month || '';
    if (feeEl) feeEl.value = course.fee;
    if (maxStudentsEl) maxStudentsEl.value = course.maxStudents;
    if (statusEl) statusEl.value = course.status;

    state.editingCourseId = id;
    const courseFormTitle = document.getElementById('courseFormTitle');
    const courseSubmitBtn = document.getElementById('courseSubmitBtn');
    const courseCancelBtn = document.getElementById('courseCancelBtn');

    if (courseFormTitle) courseFormTitle.textContent = 'Sửa Khóa Học';
    if (courseSubmitBtn) courseSubmitBtn.textContent = 'Cập Nhật';
    if (courseCancelBtn) courseCancelBtn.style.display = 'inline-block';
    
    const courseForm = document.getElementById('courseForm');
    if (courseForm) courseForm.scrollIntoView({ behavior: 'smooth' });
};

export const cancelCourseEdit = () => {
    state.editingCourseId = null;
    const courseFormTitle = document.getElementById('courseFormTitle');
    const courseSubmitBtn = document.getElementById('courseSubmitBtn');
    const courseCancelBtn = document.getElementById('courseCancelBtn');
    const courseForm = document.getElementById('courseForm');

    if (courseFormTitle) courseFormTitle.textContent = 'Thêm Khóa Học';
    if (courseSubmitBtn) courseSubmitBtn.textContent = 'Thêm Khóa Học';
    if (courseCancelBtn) courseCancelBtn.style.display = 'none';
    if (courseForm) courseForm.reset();
};

export const clearCourseFilterInputs = () => {
    const courseFilterMonth = document.getElementById('courseFilterMonth');
    const courseFilterStatus = document.getElementById('courseFilterStatus');
    const courseFilterInstructor = document.getElementById('courseFilterInstructor');
    
    if (courseFilterMonth) courseFilterMonth.value = '';
    if (courseFilterStatus) courseFilterStatus.value = '';
    if (courseFilterInstructor) courseFilterInstructor.value = '';
    renderCourseTable();
};

export const renderCourseTable = () => {
    const tableBody = document.getElementById('courseTableBody');
    const emptyMessage = document.getElementById('courseEmptyMessage');
    const filterMonth = document.getElementById('courseFilterMonth')?.value;
    const filterStatus = document.getElementById('courseFilterStatus')?.value;
    const filterInstructor = document.getElementById('courseFilterInstructor')?.value;

    if (!tableBody) return;
    tableBody.innerHTML = '';

    // Populate instructor filter
    const currentInstructor = document.getElementById('courseFilterInstructor')?.value;
    const instructors = [...new Set(state.courses.map(c => c.instructor).filter(Boolean))].sort();
    const instructorFilter = document.getElementById('courseFilterInstructor');
    if (instructorFilter) {
        instructorFilter.innerHTML = '<option value="">Tất Cả Giảng Viên</option>';
        instructors.forEach(inst => {
            instructorFilter.innerHTML += `<option value="${escapeHtml(inst)}">${escapeHtml(inst)}</option>`;
        });
        instructorFilter.value = currentInstructor;
    }

    let filtered = [...state.courses];
    if (filterMonth) {
        const filterMonthNum = parseInt(filterMonth);
        filtered = filtered.filter(c => parseInt(c.month) === filterMonthNum);
    }
    if (filterStatus) filtered = filtered.filter(c => c.status === filterStatus);
    if (filterInstructor) filtered = filtered.filter(c => c.instructor === filterInstructor);

    if (filtered.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }

    if (emptyMessage) emptyMessage.style.display = 'none';

    const quickAddSourceCourse = document.getElementById('quickAddSourceCourse');
    const currentQuickAdd = quickAddSourceCourse?.value;

    filtered.forEach(course => {
        const enrolled = getCourseEnrollmentCount(course.id);
        const tr = document.createElement('tr');
        const canEdit = checkPermission('courses', 'edit');
        const canDelete = checkPermission('courses', 'delete');
        const actions = [];
        if (canEdit) actions.push(`<button class="btn btn-edit" onclick="startCourseEdit('${course.id}')">Sửa</button>`);
        if (canDelete) actions.push(`<button class="btn btn-danger" onclick="deleteCourse('${course.id}')">Xóa</button>`);

        tr.innerHTML = `
            <td><strong>${escapeHtml(course.name)}</strong></td>
            <td>${escapeHtml(course.instructor)}</td>
            <td>Tháng ${course.month || '-'}</td>
            <td>${formatCurrency(course.fee)}</td>
            <td>${enrolled}/${course.maxStudents || '-'}</td>
            <td><span class="status-badge ${getStatusClass(course.status)}">${escapeHtml(course.status)}</span></td>
            <td class="actions-cell">${actions.join('') || '-'}</td>
        `;
        tableBody.appendChild(tr);
    });

    if (quickAddSourceCourse) {
        quickAddSourceCourse.innerHTML = '<option value="">Chọn khóa học</option>';
        state.courses.forEach(c => {
            quickAddSourceCourse.innerHTML += `<option value="${c.id}">${escapeHtml(formatCourseName(c))}</option>`;
        });
        quickAddSourceCourse.value = currentQuickAdd;
    }
};

// Quick Add Course
export const handleQuickAddCourse = async () => {
    if (!checkPermission('courses', 'add')) return;

    const sourceId = document.getElementById('quickAddSourceCourse')?.value;
    if (!sourceId) {
        alert('Vui lòng chọn khóa học gốc.');
        return;
    }

    const newMonth = document.getElementById('quickAddMonth')?.value;
    if (!newMonth) {
        alert('Vui lòng chọn tháng mới.');
        return;
    }

    const source = state.courses.find(c => c.id === sourceId);
    if (!source) {
        alert('Khóa học gốc không tồn tại.');
        return;
    }

    const duplicate = state.courses.find(c => c.name === source.name && parseInt(c.month) === parseInt(newMonth));
    if (duplicate) {
        alert(`Đã tồn tại khóa học "${source.name} - Tháng ${newMonth}".`);
        return;
    }

    const newCourse = {
        id: Date.now().toString(),
        name: source.name,
        instructor: source.instructor,
        month: parseInt(newMonth),
        fee: source.fee,
        maxStudents: source.maxStudents || 30,
        status: 'Đang mở',
        createdAt: new Date().toISOString()
    };

    if (storage.useServer) {
        try {
            const result = await api.post('courses', newCourse);
            if (!result || result.error) {
                alert('Lỗi tạo khóa học: ' + (result?.error || 'Lỗi không xác định'));
                await doRenderAll();
                return;
            }
        } catch (err) {
            alert('Lỗi kết nối server khi tạo khóa học. Vui lòng thử lại.');
            console.error('Quick add course error:', err);
            return;
        }
    }
    state.courses.push(newCourse);

    if (!storage.useServer) {
        await storage.saveCourses();
    }

    const quickAddMonth = document.getElementById('quickAddMonth');
    const quickAddSourceCourse = document.getElementById('quickAddSourceCourse');
    if (quickAddMonth) quickAddMonth.value = '';
    if (quickAddSourceCourse) quickAddSourceCourse.value = '';

    await doRenderAll();
    alert(`Đã tạo khóa học "${formatCourseName(newCourse)}" thành công!`);
};

// Quick Manage Table
export const renderQuickManageTable = () => {
    const month = parseInt(document.getElementById('quickManageMonth')?.value);
    const section = document.getElementById('quickManageSection');
    const tableBody = document.getElementById('quickManageTableBody');
    const empty = document.getElementById('quickManageEmpty');

    if (!section || !tableBody) return;

    if (!month) {
        if (section) section.style.display = 'none';
        return;
    }

    if (section) section.style.display = 'block';
    const monthCourses = state.courses.filter(c => parseInt(c.month) === month);

    if (monthCourses.length === 0) {
        if (tableBody) tableBody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';
    if (tableBody) tableBody.innerHTML = '';

    monthCourses.forEach(course => {
        const enrolled = getCourseEnrollmentCount(course.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHtml(course.name)}</strong></td>
            <td>${escapeHtml(course.instructor)}</td>
            <td>${formatCurrency(course.fee)}</td>
            <td>${enrolled}/${course.maxStudents || '-'}</td>
            <td>
                <select class="preview-edit-input quick-manage-status" data-course-id="${course.id}">
                    <option value="Chưa bắt đầu" ${course.status === 'Chưa bắt đầu' ? 'selected' : ''}>Chưa bắt đầu</option>
                    <option value="Đang mở" ${course.status === 'Đang mở' ? 'selected' : ''}>Đang mở</option>
                    <option value="Đã đầy" ${course.status === 'Đã đầy' ? 'selected' : ''}>Đã đầy</option>
                    <option value="Đã kết thúc" ${course.status === 'Đã kết thúc' ? 'selected' : ''}>Đã kết thúc</option>
                </select>
            </td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="updateQuickManageStatus('${course.id}')">Lưu</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
};

// Update quick manage status
export const updateQuickManageStatus = async courseId => {
    if (!checkPermission('courses', 'edit')) return;

    const select = document.querySelector(`.quick-manage-status[data-course-id="${courseId}"]`);
    if (!select) return;

    const newStatus = select.value;
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;

    if (storage.useServer) {
        try {
            const result = await api.put('courses', courseId, { name: course.name, instructor: course.instructor, month: course.month, fee: course.fee, maxStudents: course.maxStudents, status: newStatus });
            if (!result || result.error) {
                alert('Lỗi cập nhật trạng thái: ' + (result?.error || 'Lỗi không xác định'));
                await doRenderAll();
                return;
            }
        } catch (err) {
            alert('Lỗi kết nối server khi cập nhật trạng thái. Vui lòng thử lại.');
            console.error('Update course status error:', err);
            return;
        }
    } else {
        course.status = newStatus;
        await storage.saveCourses();
    }
    course.status = newStatus;
    await doRenderAll();
    alert(`Đã cập nhật trạng thái "${formatCourseName(course)}" thành "${newStatus}".`);
};

// Make functions global for onclick handlers
window.updateQuickManageStatus = updateQuickManageStatus;