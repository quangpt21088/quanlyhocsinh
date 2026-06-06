// modules/utils.js - Utility functions
import { state } from './state.js';

export const formatCurrency = amount => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫';
    return amount.toLocaleString('vi-VN') + ' ₫';
};

export const formatDate = dateStr => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export const getStatusClass = status => {
    const map = {
        'Đang học': 'status-active',
        'Tạm nghỉ': 'status-inactive',
        'Đã tốt nghiệp': 'status-graduated',
        'Đang mở': 'status-open',
        'Đã đầy': 'status-full',
        'Đã kết thúc': 'status-ended',
        'Chưa bắt đầu': 'status-inactive'
    };
    return map[status] || '';
};

export const escapeHtml = str => {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

export const formatCourseName = course => {
    if (!course) return '';
    return course.month ? `${course.name} - Tháng ${course.month}` : course.name;
};

export const getStudentCourseCount = studentId =>
    state.enrollments.filter(e => e.studentId === studentId).length;

export const getCourseEnrollmentCount = courseId =>
    state.enrollments.filter(e => e.courseId === courseId).length;

export const getStudentCourses = studentId =>
    state.enrollments
        .filter(e => e.studentId === studentId)
        .map(e => {
            const course = state.courses.find(c => c.id === e.courseId);
            return course ? formatCourseName(course) : 'Unknown';
        });

export const getCourseAttendanceDates = courseId => {
    const dates = [...new Set(state.attendances.filter(a => a.courseId === courseId).map(a => a.date))];
    return dates.sort((a, b) => a.localeCompare(b));
};