// modules/enrollment.js - Enrollment functions
import { state } from './state.js';
import { checkPermission } from './auth.js';
import { storage } from './storage.js';
import { getCourseEnrollmentCount, formatCourseName, formatDate, getStatusClass, escapeHtml } from './utils.js';

// Use window.renderAll to avoid circular dependency
const doRenderAll = () => { if (typeof window.renderAll === 'function') return window.renderAll(); };

export const renderEnrollmentDropdowns = () => {
    const enrollStudentSearch = document.getElementById('enrollStudentSearch');
    const currentStudentId = document.getElementById('enrollStudent')?.value;

    // Student search
    const currentStudent = state.students.find(s => s.id === currentStudentId);
    if (currentStudent && enrollStudentSearch) {
        enrollStudentSearch.value = currentStudent.name;
    } else if (enrollStudentSearch) {
        document.getElementById('enrollStudent').value = '';
        enrollStudentSearch.value = '';
    }

    // Course dropdown
    const enrollCourse = document.getElementById('enrollCourse');
    const currentCourse = enrollCourse?.value;
    if (enrollCourse) {
        enrollCourse.innerHTML = '<option value="">Chọn khóa học</option>';
        const enrollMonth = document.getElementById('enrollMonth');
        const selectedMonth = enrollMonth?.value ? parseInt(enrollMonth.value) : null;
        let enrollFilteredCourses = state.courses.filter(c => c.status === 'Đang mở');
        if (selectedMonth) {
            enrollFilteredCourses = enrollFilteredCourses.filter(c => c.month === selectedMonth);
        }
        enrollFilteredCourses.forEach(c => {
            const enrolled = getCourseEnrollmentCount(c.id);
            if (!c.maxStudents || enrolled < c.maxStudents) {
                enrollCourse.innerHTML += `<option value="${c.id}">${escapeHtml(formatCourseName(c))} (${enrolled}/${c.maxStudents || '-'})</option>`;
            }
        });
        enrollCourse.value = currentCourse;
    }

    // Filter course dropdown
    const enrollFilterCourse = document.getElementById('enrollFilterCourse');
    const currentFilterCourse = enrollFilterCourse?.value;
    if (enrollFilterCourse) {
        enrollFilterCourse.innerHTML = '<option value="">Tất Cả Khóa Học</option>';
        state.courses.forEach(c => {
            enrollFilterCourse.innerHTML += `<option value="${c.id}">${formatCourseName(c)}</option>`;
        });
        enrollFilterCourse.value = currentFilterCourse;
    }
};

export const handleStudentSearch = () => {
    const query = document.getElementById('enrollStudentSearch')?.value.trim().toLowerCase();
    const enrollStudent = document.getElementById('enrollStudent');
    const enrollStudentDropdown = document.getElementById('enrollStudentDropdown');
    
    if (enrollStudent) enrollStudent.value = '';
    if (enrollStudentDropdown) enrollStudentDropdown.style.display = 'none';

    if (!query) return;

    const matches = state.students.filter(s =>
        s.status === 'Đang học' && s.name.toLowerCase().includes(query)
    ).slice(0, 10);

    if (matches.length === 0 && enrollStudentDropdown) {
        enrollStudentDropdown.innerHTML = '<div class="autocomplete-item" style="color: var(--text-light);">Không tìm thấy</div>';
        enrollStudentDropdown.style.display = 'block';
        return;
    }

    if (enrollStudentDropdown) {
        enrollStudentDropdown.innerHTML = matches.map(s => {
            const phone = s.phone ? ` - ${s.phone}` : '';
            return `<div class="autocomplete-item" data-id="${s.id}" data-name="${escapeHtml(s.name)}">
                <strong>${escapeHtml(s.name)}</strong>
                <span class="student-info">${phone}</span>
            </div>`;
        }).join('');
        enrollStudentDropdown.style.display = 'block';

        enrollStudentDropdown.querySelectorAll('.autocomplete-item[data-id]').forEach(item => {
            item.addEventListener('click', () => {
                if (enrollStudent) enrollStudent.value = item.dataset.id;
                const enrollStudentSearch = document.getElementById('enrollStudentSearch');
                if (enrollStudentSearch) enrollStudentSearch.value = item.dataset.name;
                if (enrollStudentDropdown) enrollStudentDropdown.style.display = 'none';
            });
        });
    }
};

export const clearEnrollmentFilterInputs = () => {
    const enrollFilterCourse = document.getElementById('enrollFilterCourse');
    const enrollSearch = document.getElementById('enrollSearch');
    
    if (enrollFilterCourse) enrollFilterCourse.value = '';
    if (enrollSearch) enrollSearch.value = '';
    renderEnrollmentTable();
};

export const handleEnrollment = async e => {
    e.preventDefault();

    const isEdit = !!state.editingEnrollmentId;
    if (isEdit && !checkPermission('enrollment', 'edit')) return;
    if (!isEdit && !checkPermission('enrollment', 'add')) return;

    const studentId = document.getElementById('enrollStudent')?.value;
    const courseId = document.getElementById('enrollCourse')?.value;
    const date = document.getElementById('enrollDate')?.value;
    const discType = document.getElementById('discountType')?.value;
    const discValue = parseFloat(document.getElementById('discountValue')?.value) || 0;

    if (!studentId || !courseId) {
        alert('Vui lòng chọn học viên và khóa học.');
        return;
    }

    if (!date) {
        alert('Vui lòng chọn ngày ghi danh.');
        return;
    }

    if (discType === 'percent' && discValue > 100) {
        alert('Phần trăm ưu đãi không được vượt quá 100%.');
        return;
    }

    if (isEdit) {
        const index = state.enrollments.findIndex(e => e.id === state.editingEnrollmentId);
        if (index !== -1) {
            state.enrollments[index] = {
                ...state.enrollments[index],
                date,
                discountType: discType,
                discountValue: discValue
            };
        }
        if (storage.useServer) {
            await api.put('enrollments', state.editingEnrollmentId, { studentId, courseId, date, discountType: discType, discountValue: discValue });
        }
        cancelEnrollmentEdit();
        if (!storage.useServer) {
            await storage.saveEnrollments();
        }
        await doRenderAll();
        alert('Cập nhật ghi danh thành công!');
        return;
    }

    // Check duplicate
    if (state.enrollments.some(e => e.studentId === studentId && e.courseId === courseId)) {
        alert('Học viên này đã ghi danh vào khóa học này.');
        return;
    }

    // Check capacity
    const course = state.courses.find(c => c.id === courseId);
    if (course) {
        const enrolled = getCourseEnrollmentCount(courseId);
        if (course.maxStudents && enrolled >= course.maxStudents) {
            alert('Khóa học đã đầy.');
            return;
        }
    }

    const newId = 'en_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newEnrollment = {
        id: newId,
        studentId,
        courseId,
        date,
        discountType: discType,
        discountValue: discValue,
        createdAt: new Date().toISOString()
    };
    state.enrollments.push(newEnrollment);

    if (storage.useServer) {
        await api.post('enrollments', newEnrollment);
    } else {
        await storage.saveEnrollments();
    }
    const enrollmentForm = document.getElementById('enrollmentForm');
    if (enrollmentForm) enrollmentForm.reset();
    
    const discountValueEl = document.getElementById('discountValue');
    if (discountValueEl) discountValueEl.disabled = true;
    
    const enrollDate = document.getElementById('enrollDate');
    if (enrollDate) enrollDate.valueAsDate = new Date();
    
    await doRenderAll();
    alert('Ghi danh thành công!');
};

export const removeEnrollment = async id => {
    if (!checkPermission('enrollment', 'delete')) return;
    if (!confirm('Xóa ghi danh này?')) return;
    
    state.enrollments = state.enrollments.filter(e => e.id !== id);
    if (storage.useServer) {
        await api.delete('enrollments', id);
    } else {
        await storage.saveEnrollments();
    }
    await doRenderAll();
};

export const startEnrollmentEdit = id => {
    const enrollment = state.enrollments.find(e => e.id === id);
    if (!enrollment) return;

    state.editingEnrollmentId = id;
    
    const enrollStudent = document.getElementById('enrollStudent');
    const enrollCourse = document.getElementById('enrollCourse');
    const enrollDate = document.getElementById('enrollDate');
    const discountType = document.getElementById('discountType');
    const discountValue = document.getElementById('discountValue');
    
    if (enrollStudent) enrollStudent.value = enrollment.studentId;
    if (enrollCourse) enrollCourse.value = enrollment.courseId;
    if (enrollDate) enrollDate.value = enrollment.date;
    if (discountType) discountType.value = enrollment.discountType || '';
    if (discountValue) {
        discountValue.value = enrollment.discountValue || '';
        discountValue.disabled = !discountType?.value;
    }

    const student = state.students.find(s => s.id === enrollment.studentId);
    const enrollStudentSearch = document.getElementById('enrollStudentSearch');
    if (enrollStudentSearch) enrollStudentSearch.value = student ? student.name : '';

    if (enrollStudentSearch) enrollStudentSearch.disabled = true;
    const enrollCourseEl = document.getElementById('enrollCourse');
    if (enrollCourseEl) enrollCourseEl.disabled = true;

    const enrollmentFormTitle = document.getElementById('enrollmentFormTitle');
    const enrollmentSubmitBtn = document.getElementById('enrollmentSubmitBtn');
    const enrollmentCancelBtn = document.getElementById('enrollmentCancelBtn');

    if (enrollmentFormTitle) enrollmentFormTitle.textContent = 'Cập Nhật Ghi Danh';
    if (enrollmentSubmitBtn) enrollmentSubmitBtn.textContent = 'Cập Nhật';
    if (enrollmentCancelBtn) enrollmentCancelBtn.style.display = 'inline-block';

    const enrollmentForm = document.getElementById('enrollmentForm');
    if (enrollmentForm) window.scrollTo({ top: enrollmentForm.offsetTop - 20, behavior: 'smooth' });
};

export const cancelEnrollmentEdit = () => {
    state.editingEnrollmentId = null;
    const enrollmentForm = document.getElementById('enrollmentForm');
    const discountValueEl = document.getElementById('discountValue');
    const enrollStudentSearch = document.getElementById('enrollStudentSearch');
    const enrollCourseEl = document.getElementById('enrollCourse');
    const enrollmentFormTitle = document.getElementById('enrollmentFormTitle');
    const enrollmentSubmitBtn = document.getElementById('enrollmentSubmitBtn');
    const enrollmentCancelBtn = document.getElementById('enrollmentCancelBtn');
    const enrollDate = document.getElementById('enrollDate');

    if (enrollmentForm) enrollmentForm.reset();
    if (discountValueEl) discountValueEl.disabled = true;
    if (enrollStudentSearch) {
        enrollStudentSearch.disabled = false;
        enrollStudentSearch.value = '';
    }
    if (enrollCourseEl) enrollCourseEl.disabled = false;
    if (enrollmentFormTitle) enrollmentFormTitle.textContent = 'Ghi Danh Học Viên';
    if (enrollmentSubmitBtn) enrollmentSubmitBtn.textContent = 'Ghi Danh';
    if (enrollmentCancelBtn) enrollmentCancelBtn.style.display = 'none';
    if (enrollDate) enrollDate.valueAsDate = new Date();
};

export const getFilteredEnrollments = () => {
    let filtered = [...state.enrollments];
    const courseId = document.getElementById('enrollFilterCourse')?.value;
    const search = document.getElementById('enrollSearch')?.value.toLowerCase() || '';

    if (courseId) filtered = filtered.filter(e => e.courseId === courseId);
    if (search) {
        filtered = filtered.filter(e => {
            const student = state.students.find(s => s.id === e.studentId);
            return student && student.name.toLowerCase().includes(search);
        });
    }

    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const renderEnrollmentTable = () => {
    const filtered = getFilteredEnrollments();
    const tableBody = document.getElementById('enrollmentTableBody');
    const emptyMessage = document.getElementById('enrollmentEmptyMessage');
    const deleteAllWrap = document.getElementById('enrollmentDeleteAllWrap');

    if (!tableBody) return;

    const showDeleteAll = state.currentAdmin && state.currentAdmin.role === 'super' && state.enrollments.length > 0;
    if (deleteAllWrap) deleteAllWrap.style.display = showDeleteAll ? 'block' : 'none';

    tableBody.innerHTML = '';

    if (filtered.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }

    if (emptyMessage) emptyMessage.style.display = 'none';

    const canEdit = checkPermission('enrollment', 'edit');
    const canDelete = checkPermission('enrollment', 'delete');

    filtered.forEach(enrollment => {
        const student = state.students.find(s => s.id === enrollment.studentId);
        const course = state.courses.find(c => c.id === enrollment.courseId);

        let discountText = '-';
        if (enrollment.discountType === 'percent') {
            discountText = enrollment.discountValue + '%';
        } else if (enrollment.discountType === 'amount') {
            discountText = enrollment.discountValue.toLocaleString('vi-VN') + ' ₫';
        }

        const actions = [];
        if (canEdit) actions.push(`<button class="btn btn-primary" onclick="startEnrollmentEdit('${enrollment.id}')">Sửa</button>`);
        if (canDelete) actions.push(`<button class="btn btn-danger" onclick="removeEnrollment('${enrollment.id}')">Xóa</button>`);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHtml(student ? student.name : 'Đã xóa')}</strong></td>
            <td>${escapeHtml(course ? formatCourseName(course) : 'Đã xóa')}</td>
            <td>${formatDate(enrollment.date)}</td>
            <td>${escapeHtml(discountText)}</td>
            <td class="actions-cell">${actions.join('') || '-'}</td>
        `;
        tableBody.appendChild(tr);
    });
};

export const handleDeleteAllEnrollments = async () => {
    if (!state.currentAdmin || state.currentAdmin.role !== 'super') return;
    if (!confirm('Bạn có chắc muốn xóa TOÀN BỘ ghi danh? Hành động này không thể hoàn tác.')) return;
    if (!confirm('Xác nhận lần 2: Xóa tất cả ' + state.enrollments.length + ' ghi danh?')) return;
    
    if (storage.useServer) {
        for (const e of state.enrollments) {
            await api.delete('enrollments', e.id);
        }
    }
    state.enrollments = [];
    if (!storage.useServer) {
        await storage.saveEnrollments();
    }
    await doRenderAll();
};

// Copy Enrollment functions
export const renderCopyEnrollmentDropdowns = () => {
    const copyEnrollMonth = document.getElementById('copyEnrollMonth');
    const copyFromCourse = document.getElementById('copyFromCourse');
    const copyToCourse = document.getElementById('copyToCourse');

    if (!copyEnrollMonth || !copyFromCourse || !copyToCourse) return;

    const selectedMonth = copyEnrollMonth.value;
    if (!selectedMonth) {
        copyFromCourse.innerHTML = '<option value="">Chọn khóa học nguồn</option>';
        copyToCourse.innerHTML = '<option value="">Chọn khóa học đích</option>';
        updateCopyEnrollmentInfo();
        return;
    }

    const courses = state.courses.filter(c => c.month === parseInt(selectedMonth));
    const currentFrom = copyFromCourse.value;
    const currentTo = copyToCourse.value;

    copyFromCourse.innerHTML = '<option value="">Chọn khóa học nguồn</option>';
    copyToCourse.innerHTML = '<option value="">Chọn khóa học đích</option>';

    courses.forEach(c => {
        const enrolled = state.enrollments.filter(e => e.courseId === c.id).length;
        copyFromCourse.innerHTML += `<option value="${c.id}">${escapeHtml(formatCourseName(c))} (${enrolled} học viên)</option>`;
        copyToCourse.innerHTML += `<option value="${c.id}">${escapeHtml(formatCourseName(c))} (${enrolled} học viên)</option>`;
    });

    copyFromCourse.value = currentFrom;
    copyToCourse.value = currentTo;
    updateCopyEnrollmentInfo();
};

export const updateCopyEnrollmentInfo = () => {
    const copyFromCourse = document.getElementById('copyFromCourse');
    const copyToCourse = document.getElementById('copyToCourse');
    const copyInfo = document.getElementById('copyInfo');
    const copyStudentCount = document.getElementById('copyStudentCount');
    const copyBtn = document.getElementById('copyEnrollmentBtn');

    if (!copyFromCourse || !copyToCourse || !copyInfo) return;

    const fromId = copyFromCourse.value;
    const toId = copyToCourse.value;

    if (!fromId || !toId || fromId === toId) {
        copyInfo.style.display = 'none';
        if (copyBtn) copyBtn.disabled = true;
        return;
    }

    const fromCourse = state.courses.find(c => c.id === fromId);
    const toCourse = state.courses.find(c => c.id === toId);

    const enrollments = state.enrollments.filter(e => e.courseId === fromId);
    const studentIds = [...new Set(enrollments.map(e => e.studentId))];

    // Check which students are already enrolled in target course
    const existingInTarget = state.enrollments
        .filter(e => e.courseId === toId)
        .map(e => e.studentId);

    const newStudents = studentIds.filter(id => !existingInTarget.includes(id));
    const duplicateCount = studentIds.length - newStudents.length;

    copyInfo.style.display = 'block';
    if (copyStudentCount) {
        copyStudentCount.innerHTML = `
            <strong>Từ:</strong> ${escapeHtml(formatCourseName(fromCourse))}<br>
            <strong>Sang:</strong> ${escapeHtml(formatCourseName(toCourse))}<br>
            <strong>Sẽ sao chép:</strong> ${newStudents.length} học viên mới<br>
            ${duplicateCount > 0 ? `<span style="color: var(--warning);"><strong>Bỏ qua:</strong> ${duplicateCount} học viên đã ghi danh</span>` : ''}
        `;
    }
    if (copyBtn) copyBtn.disabled = false;
};

export const handleCopyEnrollment = async () => {
    if (!checkPermission('enrollment', 'add')) return;

    const copyFromCourse = document.getElementById('copyFromCourse');
    const copyToCourse = document.getElementById('copyToCourse');
    const copyEnrollMonth = document.getElementById('copyEnrollMonth');

    if (!copyFromCourse || !copyToCourse || !copyEnrollMonth) return;

    const fromId = copyFromCourse.value;
    const toId = copyToCourse.value;

    if (!fromId || !toId) {
        alert('Vui lòng chọn khóa học nguồn và đích.');
        return;
    }

    if (fromId === toId) {
        alert('Khóa học nguồn và đích phải khác nhau.');
        return;
    }

    const fromCourse = state.courses.find(c => c.id === fromId);
    const toCourse = state.courses.find(c => c.id === toId);

    if (!fromCourse || !toCourse) {
        alert('Không tìm thấy khóa học.');
        return;
    }

    const sourceEnrollments = state.enrollments.filter(e => e.courseId === fromId);
    const existingInTarget = new Set(
        state.enrollments.filter(e => e.courseId === toId).map(e => e.studentId)
    );

    const newEnrollments = sourceEnrollments
        .filter(e => !existingInTarget.has(e.studentId))
        .map(e => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            studentId: e.studentId,
            courseId: toId,
            date: new Date().toISOString().split('T')[0],
            discountType: e.discountType || '',
            discountValue: e.discountValue || 0,
            createdAt: new Date().toISOString()
        }));

    if (newEnrollments.length === 0) {
        alert('Tất cả học viên đã có trong khóa học đích.');
        return;
    }

    const confirmMsg = `Sao chép ${newEnrollments.length} học viên từ "${formatCourseName(fromCourse)}" sang "${formatCourseName(toCourse)}"?`;
    if (!confirm(confirmMsg)) return;

    state.enrollments.push(...newEnrollments);
    if (storage.useServer) {
        for (const e of newEnrollments) {
            await api.post('enrollments', e);
        }
    } else {
        await storage.saveEnrollments();
    }
    await doRenderAll();

    // Reset form
    copyFromCourse.value = '';
    copyToCourse.value = '';
    copyEnrollMonth.value = '';
    document.getElementById('copyInfo').style.display = 'none';

    alert(`Đã sao chép thành công ${newEnrollments.length} học viên!`);
};

// Initialize copy enrollment section
export const initCopyEnrollment = () => {
    const copyEnrollMonth = document.getElementById('copyEnrollMonth');
    const copyFromCourse = document.getElementById('copyFromCourse');
    const copyToCourse = document.getElementById('copyToCourse');
    const copyBtn = document.getElementById('copyEnrollmentBtn');

    if (copyEnrollMonth) {
        copyEnrollMonth.addEventListener('change', () => {
            renderCopyEnrollmentDropdowns();
        });
    }

    if (copyFromCourse) {
        copyFromCourse.addEventListener('change', updateCopyEnrollmentInfo);
    }

    if (copyToCourse) {
        copyToCourse.addEventListener('change', updateCopyEnrollmentInfo);
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', handleCopyEnrollment);
    }
};