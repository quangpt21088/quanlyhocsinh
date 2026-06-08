// modules/render-all.js - Render all UI components
// NOTE: This file should be imported ONLY by app.js, not by other modules
// Other modules should call renderAll from app.js via window.renderAll if needed

import { state } from './state.js';
import { storage } from './storage.js';
import { renderStudentTable } from './student.js';
import { renderCourseTable } from './course.js';
import { renderEnrollmentDropdowns, renderEnrollmentTable } from './enrollment.js';
import { renderAttendanceDropdowns, renderAttendanceMatrix } from './attendance.js';
import { renderPaymentDropdowns, renderPaymentStudents, renderPaymentDetails } from './payment.js';
import { renderReportDropdowns, handleReportPeriodChange } from './report.js';
import { renderAdminTable } from './admin.js';

export const renderAll = async () => {
    try {
        await Promise.all([
            storage.getStudents(),
            storage.getCourses(),
            storage.getEnrollments(),
            storage.getAdmins()
        ]);
    } catch (err) {
        console.error('Error loading data:', err);
        if (!state.students.length) state.students = [];
        if (!state.courses.length) state.courses = [];
        if (!state.enrollments.length) state.enrollments = [];
        if (!state.admins.length) state.admins = [];
    }

    try {
        renderSummary();
        renderStudentTable();
        renderCourseTable();
        renderEnrollmentDropdowns();
        renderEnrollmentTable();
        renderAttendanceDropdowns();
        renderAttendanceMatrix();
        renderPaymentDropdowns();
        renderReportDropdowns();
        handleReportPeriodChange();

        if (state.paymentSelectedCourseId && state.paymentSelectedMonth) {
            renderPaymentStudents(state.paymentSelectedCourseId, state.paymentSelectedStatus, state.paymentSelectedMonth);
            if (state.paymentSelectedStudentId) {
                renderPaymentDetails(state.paymentSelectedCourseId, state.paymentSelectedStudentId);
            }
        }

        renderAdminTable();
    } catch (err) {
        console.error('Error rendering UI:', err);
    }
};

export const renderSummary = () => {
    const totalStudents = document.getElementById('totalStudents');
    const activeStudents = document.getElementById('activeStudents');
    const totalCourses = document.getElementById('totalCourses');

    if (totalStudents) totalStudents.textContent = state.students.length;
    if (activeStudents) activeStudents.textContent = state.students.filter(s => s.status === 'Đang học').length;
    if (totalCourses) totalCourses.textContent = state.courses.length;
};