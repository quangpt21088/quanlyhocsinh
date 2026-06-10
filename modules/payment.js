// modules/payment.js - Payment functions
import { state } from './state.js';
import { checkPermission } from './auth.js';
import { storage } from './storage.js';
import { formatCurrency, formatDate, getStatusClass, formatCourseName, getCourseAttendanceDates, escapeHtml, generateId } from './utils.js';

export const renderPaymentDropdowns = selectedMonth => {
    const paymentCourseSelect = document.getElementById('paymentCourseSelect');
    const currentCourse = paymentCourseSelect?.value;
    
    if (!paymentCourseSelect) return;
    
    paymentCourseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';
    const filteredCourses = selectedMonth 
        ? state.courses.filter(c => c.month == selectedMonth)
        : state.courses;
    
    filteredCourses.forEach(c => {
        paymentCourseSelect.innerHTML += `<option value="${c.id}">${escapeHtml(formatCourseName(c))}</option>`;
    });
    paymentCourseSelect.value = currentCourse;
};

export const handlePaymentSelect = async () => {
    const courseId = document.getElementById('paymentCourseSelect')?.value;
    const status = document.getElementById('paymentStatusFilter')?.value;
    const month = document.getElementById('paymentMonthFilter')?.value;

    if (!courseId) {
        alert('Vui lòng chọn khóa học.');
        return;
    }

    if (!month) {
        alert('Vui lòng chọn tháng.');
        return;
    }

    state.paymentSelectedCourseId = courseId;
    state.paymentSelectedStatus = status;
    state.paymentSelectedMonth = month;
    state.paymentSelectedStudentId = null;

    await renderPaymentStudents(courseId, status, month);

    const paymentDetailContent = document.getElementById('paymentDetailContent');
    const paymentDetailEmpty = document.getElementById('paymentDetailEmpty');
    
    if (paymentDetailContent) paymentDetailContent.style.display = 'none';
    if (paymentDetailEmpty) {
        paymentDetailEmpty.style.display = 'block';
        paymentDetailEmpty.textContent = 'Chọn học viên để xem chi tiết.';
    }
};

export const renderPaymentStudents = async (courseId, status, month) => {
    const course = state.courses.find(c => c.id === courseId);
    const studentTitle = document.getElementById('paymentStudentTitle');
    if (studentTitle && course) {
        studentTitle.textContent = `Danh Sách Học Viên - ${formatCourseName(course)}`;
    }

    const enrolledStudentIds = state.enrollments
        .filter(e => e.courseId === courseId)
        .map(e => e.studentId);

    let enrolledStudents = state.students.filter(s => enrolledStudentIds.includes(s.id));

    if (status) {
        enrolledStudents = enrolledStudents.filter(s => s.status === status);
    }

    if (month) {
        enrolledStudents = enrolledStudents.filter(s => {
            return state.attendances.some(a =>
                a.studentId === s.id &&
                a.courseId === courseId &&
                new Date(a.date).getMonth() + 1 === parseInt(month)
            );
        });
    }

    const tableBody = document.getElementById('paymentStudentTableBody');
    const emptyMessage = document.getElementById('paymentStudentEmpty');
    
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (enrolledStudents.length === 0) {
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
            emptyMessage.textContent = `Không có học viên nào đi học trong tháng ${month}.`;
        }
        return;
    }

    if (emptyMessage) emptyMessage.style.display = 'none';

    enrolledStudents.forEach((student, index) => {
        const tr = document.createElement('tr');
        const statusClass = student.status === 'Đang học' ? 'active' : student.status === 'Tạm nghỉ' ? 'inactive' : 'graduated';

        const existingRecord = state.paymentRecords.find(r =>
            r.studentId === student.id &&
            r.courseId === courseId &&
            r.month === month
        );
        const paymentStatus = existingRecord ? existingRecord.status : 'Chưa thanh toán';

        const isUnpaid = paymentStatus === 'Chưa thanh toán';
        const rowClass = isUnpaid ? 'payment-unpaid' : '';

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(student.name)}</strong></td>
            <td>${escapeHtml(student.phone)}</td>
            <td><span class="status-badge status-${statusClass}">${escapeHtml(student.status)}</span></td>
            <td class="actions-cell">
                <select class="payment-status-select" data-student-id="${student.id}">
                    <option value="Chưa thanh toán" ${paymentStatus === 'Chưa thanh toán' ? 'selected' : ''}>Chưa thanh toán</option>
                    <option value="Đã thanh toán" ${paymentStatus === 'Đã thanh toán' ? 'selected' : ''}>Đã thanh toán</option>
                    <option value="Công nợ tháng tiếp theo" ${paymentStatus === 'Công nợ tháng tiếp theo' ? 'selected' : ''}>Công nợ tháng tiếp theo</option>
                </select>
                <button class="btn-select btn-sm" onclick="selectPaymentStudent('${student.id}')">Chọn</button>
            </td>
        `;
        
        if (rowClass) tr.className += ` ${rowClass}`;
        tableBody.appendChild(tr);
    });
};

// Make selectPaymentStudent global for onclick handler
export const selectPaymentStudent = (studentId) => {
    state.paymentSelectedStudentId = studentId;
    renderPaymentStudents(state.paymentSelectedCourseId, state.paymentSelectedStatus, state.paymentSelectedMonth);
    renderPaymentDetails(state.paymentSelectedCourseId, studentId);
};

window.selectPaymentStudent = selectPaymentStudent;

export const renderPaymentDetails = (courseId, studentId) => {
    const course = state.courses.find(c => c.id === courseId);
    const student = state.students.find(s => s.id === studentId);

    if (!course || !student) {
        const paymentDetailContent = document.getElementById('paymentDetailContent');
        const paymentDetailEmpty = document.getElementById('paymentDetailEmpty');
        if (paymentDetailContent) paymentDetailContent.style.display = 'none';
        if (paymentDetailEmpty) paymentDetailEmpty.style.display = 'block';
        return;
    }

    const paymentDetailEmpty = document.getElementById('paymentDetailEmpty');
    const paymentDetailContent = document.getElementById('paymentDetailContent');
    
    if (paymentDetailEmpty) paymentDetailEmpty.style.display = 'none';
    if (paymentDetailContent) paymentDetailContent.style.display = 'block';

    const month = parseInt(state.paymentSelectedMonth);

    const allDates = getCourseAttendanceDates(courseId).filter(date => {
        return new Date(date).getMonth() + 1 === month;
    });
    const totalSessions = allDates.length;

    const studentAttendance = state.attendances.filter(
        a => a.studentId === studentId && a.courseId === courseId && a.present &&
            new Date(a.date).getMonth() + 1 === month
    );
    const presentDates = studentAttendance.map(a => a.date);
    const presentCount = presentDates.length;
    const absentCount = totalSessions - presentCount;

    const feePerSession = course.fee;
    const totalAmount = presentCount * feePerSession;

    const enrollment = state.enrollments.find(e => e.studentId === studentId && e.courseId === courseId);
    let discountAmount = 0;
    let discountText = 'Không';
    if (enrollment && enrollment.discountType) {
        if (enrollment.discountType === 'percent') {
            discountAmount = totalAmount * enrollment.discountValue / 100;
            discountText = enrollment.discountValue + '%';
        } else if (enrollment.discountType === 'amount') {
            discountAmount = enrollment.discountValue;
            discountText = formatCurrency(enrollment.discountValue);
        }
    }
    const finalAmount = Math.max(0, totalAmount - discountAmount);

    // Render student info
    const studentInfo = document.getElementById('paymentStudentInfo');
    if (studentInfo) {
        studentInfo.innerHTML = `
            <div>
                <span class="info-label">Họ tên:</span>
                <span class="info-value">${escapeHtml(student.name)}</span>
            </div>
            <div>
                <span class="info-label">SĐT:</span>
                <span class="info-value">${escapeHtml(student.phone)}</span>
            </div>
            <div>
                <span class="info-label">Khóa học:</span>
                <span class="info-value">${escapeHtml(formatCourseName(course))}</span>
            </div>
            <div>
                <span class="info-label">Giảng viên:</span>
                <span class="info-value">${escapeHtml(course.instructor)}</span>
            </div>
        `;
    }

    // Render attendance table
    const attendanceBody = document.getElementById('paymentAttendanceBody');
    if (attendanceBody) {
        attendanceBody.innerHTML = '';

        if (allDates.length === 0) {
            attendanceBody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align:center; color:var(--text-light); padding:1rem;">
                        Chưa có dữ liệu điểm danh.
                    </td>
                </tr>
            `;
        } else {
            allDates.forEach((date, index) => {
                const isPresent = presentDates.includes(date);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${formatDate(date)}</td>
                    <td>
                        <span class="status-badge ${isPresent ? 'status-active' : 'status-inactive'}">
                            ${isPresent ? 'Có mặt' : 'Vắng mặt'}
                        </span>
                    </td>
                `;
                attendanceBody.appendChild(tr);
            });
        }
    }

    // Render payment summary
    const summary = document.getElementById('paymentSummary');
    if (summary) {
        summary.innerHTML = `
            <div class="summary-row">
                <span>Học phí/buổi:</span>
                <span>${formatCurrency(course.fee)}</span>
            </div>
            <div class="summary-row">
                <span>Tổng số buổi:</span>
                <span>${totalSessions} buổi</span>
            </div>
            <div class="summary-row">
                <span>Số buổi đi học:</span>
                <span>${presentCount} buổi</span>
            </div>
            <div class="summary-row">
                <span>Số buổi vắng:</span>
                <span>${absentCount} buổi</span>
            </div>
            <div class="summary-row">
                <span>Tổng tiền:</span>
                <span>${formatCurrency(totalAmount)}</span>
            </div>
            <div class="summary-row">
                <span>Ưu đãi (${discountText}):</span>
                <span>-${formatCurrency(discountAmount)}</span>
            </div>
            <div class="summary-row total">
                <span><strong>SỐ TIỀN CẦN NỘP:</strong></span>
                <span><strong>${formatCurrency(finalAmount)}</strong></span>
            </div>
        `;
    }
};

export const handlePaymentConfirm = async () => {
    if (!checkPermission('payment', 'edit')) return;
    if (!state.paymentSelectedCourseId || !state.paymentSelectedStudentId || !state.paymentSelectedMonth) {
        alert('Vui lòng chọn khóa học, tháng và học viên trước.');
        return;
    }

    const status = document.getElementById('paymentStatusSelect')?.value;
    const method = document.getElementById('paymentMethodSelect')?.value;

    const existingIndex = state.paymentRecords.findIndex(r =>
        r.studentId === state.paymentSelectedStudentId &&
        r.courseId === state.paymentSelectedCourseId &&
        r.month === state.paymentSelectedMonth
    );

    const now = new Date().toISOString();
    const record = {
        id: existingIndex !== -1 ? state.paymentRecords[existingIndex].id : generateId('pay_'),
        studentId: state.paymentSelectedStudentId,
        courseId: state.paymentSelectedCourseId,
        month: state.paymentSelectedMonth,
        status: status,
        method: method,
        createdAt: existingIndex !== -1 ? state.paymentRecords[existingIndex].createdAt : now,
        updatedAt: now
    };

    if (storage.useServer) {
        try {
            if (existingIndex !== -1) {
                const result = await api.put('payments', record.id, { studentId: record.studentId, courseId: record.courseId, month: record.month, status: record.status, method: record.method });
                if (!result || result.error) {
                    alert('Lỗi cập nhật thanh toán: ' + (result?.error || 'Lỗi không xác định'));
                    return;
                }
            } else {
                const result = await api.post('payments', { id: record.id, studentId: record.studentId, courseId: record.courseId, month: record.month, status: record.status, method: record.method, createdAt: record.createdAt });
                if (!result || result.error) {
                    alert('Lỗi tạo thanh toán: ' + (result?.error || 'Lỗi không xác định'));
                    return;
                }
            }
        } catch (err) {
            alert('Lỗi kết nối server khi cập nhật thanh toán. Vui lòng thử lại.');
            console.error('Payment error:', err);
            return;
        }
    }

    if (existingIndex !== -1) {
        state.paymentRecords[existingIndex] = record;
    } else {
        state.paymentRecords.push(record);
    }

    if (!storage.useServer) {
        await storage.savePaymentRecords();
    }
    alert('Cập nhật trạng thái thanh toán thành công!');
    if (state.paymentSelectedCourseId && state.paymentSelectedMonth) {
        renderPaymentStudents(state.paymentSelectedCourseId, state.paymentSelectedStatus, state.paymentSelectedMonth);
    }
};

export const handleSavePaymentStatuses = async () => {
    if (!checkPermission('payment', 'edit')) return;
    if (!state.paymentSelectedCourseId || !state.paymentSelectedMonth) {
        alert('Vui lòng chọn khóa học và tháng trước.');
        return;
    }

    const statusSelects = document.querySelectorAll('.payment-status-select');
    let updatedCount = 0;

    const toUpdate = [];
    const toCreate = [];
    statusSelects.forEach(select => {
        const studentId = select.dataset.studentId;
        const newStatus = select.value;

        const existingIndex = state.paymentRecords.findIndex(r =>
            r.studentId === studentId &&
            r.courseId === state.paymentSelectedCourseId &&
            r.month === state.paymentSelectedMonth
        );

        if (existingIndex !== -1) {
            state.paymentRecords[existingIndex].status = newStatus;
            state.paymentRecords[existingIndex].updatedAt = new Date().toISOString();
            if (storage.useServer) {
                const r = state.paymentRecords[existingIndex];
                toUpdate.push(r);
            }
        } else {
            if (newStatus !== 'Chưa thanh toán') {
                const now = new Date().toISOString();
                const newRecord = {
                    id: generateId('pay_'),
                    studentId: studentId,
                    courseId: state.paymentSelectedCourseId,
                    month: state.paymentSelectedMonth,
                    status: newStatus,
                    method: '',
                    createdAt: now,
                    updatedAt: now
                };
                state.paymentRecords.push(newRecord);
                toCreate.push(newRecord);
            }
        }
        updatedCount++;
    });

    if (storage.useServer) {
        try {
            for (const r of toUpdate) {
                const result = await api.put('payments', r.id, { studentId: r.studentId, courseId: r.courseId, month: r.month, status: r.status, method: r.method });
                if (!result || result.error) {
                    alert('Lỗi cập nhật thanh toán: ' + (result?.error || 'Lỗi không xác định'));
                    return;
                }
            }
            for (const r of toCreate) {
                const result = await api.post('payments', { id: r.id, studentId: r.studentId, courseId: r.courseId, month: r.month, status: r.status, method: r.method, createdAt: r.createdAt });
                if (!result || result.error) {
                    alert('Lỗi tạo thanh toán: ' + (result?.error || 'Lỗi không xác định'));
                    return;
                }
            }
        } catch (err) {
            alert('Lỗi kết nối server khi cập nhật thanh toán. Vui lòng thử lại.');
            console.error('Save payment statuses error:', err);
            return;
        }
    } else {
        await storage.savePaymentRecords();
    }
    alert(`Đã cập nhật trạng thái thanh toán cho ${updatedCount} học viên!`);
    renderPaymentStudents(state.paymentSelectedCourseId, state.paymentSelectedStatus, state.paymentSelectedMonth);
};

export const handleCancelPaymentStatuses = () => {
    renderPaymentStudents(state.paymentSelectedCourseId, state.paymentSelectedStatus, state.paymentSelectedMonth);
    alert('Đã hủy thay đổi trạng thái thanh toán.');
};

// Assign to window for onclick handlers
window.handlePaymentConfirm = handlePaymentConfirm;
window.handleSavePaymentStatuses = handleSavePaymentStatuses;
window.handleCancelPaymentStatuses = handleCancelPaymentStatuses;