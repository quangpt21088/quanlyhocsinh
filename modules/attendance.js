// modules/attendance.js - Attendance functions
import { state } from './state.js';
import { checkPermission } from './auth.js';
import { storage } from './storage.js';
import { formatDate, getCourseAttendanceDates, escapeHtml } from './utils.js';

export const renderAttendanceDropdowns = () => {
    const attendCourse = document.getElementById('attendCourse');
    const currentCourse = attendCourse?.value;
    
    if (!attendCourse) return;
    
    attendCourse.innerHTML = '<option value="">Chọn khóa học</option>';
    const filteredCourses = state.courses.filter(c => c.status === 'Đang mở');
    filteredCourses.forEach(c => {
        attendCourse.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)}${c.month ? ' - Tháng ' + c.month : ''}</option>`;
    });
    attendCourse.value = currentCourse;
};

export const getStudentAttendanceCount = (studentId, courseId) => {
    return state.attendances.filter(a => a.studentId === studentId && a.courseId === courseId).length;
};

export const handleAddDate = async () => {
    if (!checkPermission('attendance', 'add')) return;
    
    const courseId = document.getElementById('attendCourse')?.value;
    const date = document.getElementById('attendDate')?.value;
    const selectedMonth = document.getElementById('attendMonth')?.value;

    const attendCourse = document.getElementById('attendCourse');
    const attendDate = document.getElementById('attendDate');
    
    if (!courseId) {
        alert('Vui lòng chọn khóa học.');
        return;
    }
    if (!date) {
        alert('Vui lòng chọn ngày.');
        return;
    }

    if (selectedMonth && date) {
        const dateMonth = new Date(date).getMonth() + 1;
        if (dateMonth !== parseInt(selectedMonth)) {
            alert(`Ngày đã chọn không thuộc tháng ${selectedMonth}. Vui lòng chọn ngày trong tháng.`);
            return;
        }
    }

    const existingDates = getCourseAttendanceDates(courseId);
    if (existingDates.includes(date)) {
        alert('Ngày này đã tồn tại.');
        return;
    }

    const enrolledStudentIds = state.enrollments
        .filter(e => e.courseId === courseId)
        .map(e => e.studentId);

    enrolledStudentIds.forEach(studentId => {
        state.attendances.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            courseId: courseId,
            date: date,
            studentId: studentId,
            present: false,
            createdAt: new Date().toISOString()
        });
    });

    await storage.saveAttendances();
    renderAttendanceMatrix();
    alert(`Đã thêm ngày ${new Date(date).toLocaleDateString('vi-VN')} vào bảng điểm danh.`);
};

export const renderAttendanceMatrix = () => {
    const courseId = document.getElementById('attendCourse')?.value;
    const selectedMonth = document.getElementById('attendMonth')?.value;
    const matrixSection = document.getElementById('attendanceMatrixSection');
    const emptyMessage = document.getElementById('attendanceEmptyMessage');

    if (!matrixSection) return;

    if (!courseId) {
        matrixSection.style.display = 'none';
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
            emptyMessage.textContent = 'Chọn khóa học để bắt đầu điểm danh.';
        }
        return;
    }

    const enrolledStudentIds = state.enrollments
        .filter(e => e.courseId === courseId)
        .map(e => e.studentId);

    const enrolledStudents = state.students.filter(s => enrolledStudentIds.includes(s.id));

    if (enrolledStudents.length === 0) {
        matrixSection.style.display = 'none';
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
            emptyMessage.textContent = 'Khóa học chưa có học viên ghi danh.';
        }
        return;
    }

    let dates = getCourseAttendanceDates(courseId);
    if (selectedMonth) {
        dates = dates.filter(d => new Date(d).getMonth() + 1 === parseInt(selectedMonth));
    }

    if (emptyMessage) emptyMessage.style.display = 'none';
    matrixSection.style.display = 'block';

    const course = state.courses.find(c => c.id === courseId);
    const matrixTitle = document.getElementById('attendanceMatrixTitle');
    if (matrixTitle && course) {
        matrixTitle.textContent = `Bảng Điểm Danh - ${escapeHtml(course.name)}${course.month ? ' - Tháng ' + course.month : ''}`;
    }

    const matrixHead = document.getElementById('attendanceMatrixHead');
    const matrixBody = document.getElementById('attendanceMatrixBody');
    
    if (!matrixHead || !matrixBody) return;

    const canDeleteDate = checkPermission('attendance', 'delete');
    let headerHTML = '<tr><th class="col-stt">STT</th><th class="col-name">Họ Tên</th>';
    
    dates.forEach(date => {
        const deleteBtn = canDeleteDate ? `<button class="delete-date" onclick="deleteAttendanceDate('${date}')" title="Xóa ngày">✕</button>` : '';
        headerHTML += `<th>
            <div class="date-header">
                <span>${formatDate(date)}</span>
                ${deleteBtn}
            </div>
        </th>`;
    });
    headerHTML += '</tr>';
    matrixHead.innerHTML = headerHTML;

    const canEditAttendance = checkPermission('attendance', 'edit');
    matrixBody.innerHTML = '';

    enrolledStudents.forEach((student, index) => {
        const tr = document.createElement('tr');
        let rowHTML = `<td class="col-stt">${index + 1}</td><td class="col-name"><strong>${escapeHtml(student.name)}</strong></td>`;

        dates.forEach(date => {
            const record = state.attendances.find(
                a => a.studentId === student.id && a.courseId === courseId && a.date === date
            );
            const isChecked = record && record.present;
            const disabled = canEditAttendance ? '' : 'disabled';
            rowHTML += `<td><input type="checkbox" data-student="${student.id}" data-date="${date}" ${isChecked ? 'checked' : ''} ${disabled}></td>`;
        });

        tr.innerHTML = rowHTML;
        matrixBody.appendChild(tr);
    });
};

export const deleteAttendanceDate = async date => {
    if (!checkPermission('attendance', 'delete')) return;
    const courseId = document.getElementById('attendCourse')?.value;
    
    if (!confirm(`Xóa tất cả dữ liệu điểm danh ngày ${formatDate(date)}?`)) return;

    state.attendances = state.attendances.filter(a => !(a.courseId === courseId && a.date === date));
    await storage.saveAttendances();
    renderAttendanceMatrix();
};

export const handleSaveAttendance = async () => {
    if (!checkPermission('attendance', 'edit')) return;
    const courseId = document.getElementById('attendCourse')?.value;
    const matrixBody = document.getElementById('attendanceMatrixBody');

    if (!courseId) {
        alert('Vui lòng chọn khóa học.');
        return;
    }

    const dates = getCourseAttendanceDates(courseId);
    if (dates.length === 0) {
        alert('Chưa có ngày điểm danh nào.');
        return;
    }

    // Xóa attendance cũ
    state.attendances = state.attendances.filter(a => a.courseId !== courseId);

    // Lưu attendance mới từ checkbox
    const checkboxes = matrixBody?.querySelectorAll('input[type="checkbox"]') || [];
    checkboxes.forEach(cb => {
        state.attendances.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            courseId: courseId,
            date: cb.dataset.date,
            studentId: cb.dataset.student,
            present: cb.checked,
            createdAt: new Date().toISOString()
        });
    });

    await storage.saveAttendances();
    renderAttendanceDropdowns();
    alert('Đã lưu điểm danh thành công!');
};