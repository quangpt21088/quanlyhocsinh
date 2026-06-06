// app.js - Entry point (simplified)
import { state, resetEditStates } from './modules/state.js';
import { storage } from './modules/storage.js';
import { handleLogin, handleLogout, checkPermission, readPermissionMatrix, setPermissionMatrix, resetPermissionMatrix } from './modules/auth.js';
import { handleStudentSubmit, renderStudentTable, deleteStudent, startStudentEdit, cancelStudentEdit, getFilteredStudents, handleDeleteFilteredStudents, showStudentDetail, closeStudentDetailModal, clearStudentFilterInputs } from './modules/student.js';
import { handleCourseSubmit, renderCourseTable, deleteCourse, startCourseEdit, cancelCourseEdit, clearCourseFilterInputs, handleQuickAddCourse, renderQuickManageTable, updateQuickManageStatus } from './modules/course.js';
import { handleEnrollment, renderEnrollmentTable, removeEnrollment, startEnrollmentEdit, cancelEnrollmentEdit, clearEnrollmentFilterInputs, renderEnrollmentDropdowns, handleStudentSearch, handleDeleteAllEnrollments, handleCopyEnrollment, initCopyEnrollment, renderCopyEnrollmentDropdowns, updateCopyEnrollmentInfo } from './modules/enrollment.js';
import { renderAttendanceDropdowns, renderAttendanceMatrix, handleAddDate, handleSaveAttendance, deleteAttendanceDate } from './modules/attendance.js';
import { renderPaymentDropdowns, handlePaymentSelect, renderPaymentStudents, renderPaymentDetails, selectPaymentStudent } from './modules/payment.js';
import { renderReportDropdowns, handleReportPeriodChange, renderReport, handleYearChange, handleMonthChange, handleQuarterChange } from './modules/report.js';
import { renderAdminTable, startAdminEdit, cancelAdminEdit, deleteAdmin } from './modules/admin.js';
import { renderAll, renderSummary } from './modules/render-all.js';
import { switchTab, showLogin, showApp, applyPermissions } from './modules/ui.js';
import { openChangePassword, closeChangePassword, handlePasswordChange } from './modules/auth.js';
import { handlePaymentConfirm, handleSavePaymentStatuses, handleCancelPaymentStatuses } from './modules/payment.js';
import { mergeStudents, initMergeStudents, updateMergePreview } from './modules/merge-students.js';
import { parseExcelFile, renderPreviewTable, importStudents, generateTemplate } from './modules/excel-import.js';

// Assign renderAll to window for circular dependency avoidance
window.renderAll = renderAll;

// Assign functions to window for onclick handlers
window.showStudentDetail = showStudentDetail;
window.closeStudentDetailModal = closeStudentDetailModal;
window.startStudentEdit = startStudentEdit;
window.cancelStudentEdit = cancelStudentEdit;
window.deleteStudent = deleteStudent;
window.startCourseEdit = startCourseEdit;
window.cancelCourseEdit = cancelCourseEdit;
window.deleteCourse = deleteCourse;
window.startEnrollmentEdit = startEnrollmentEdit;
window.cancelEnrollmentEdit = cancelEnrollmentEdit;
window.removeEnrollment = removeEnrollment;
window.startAdminEdit = startAdminEdit;
window.deleteAdmin = deleteAdmin;
window.deleteAttendanceDate = deleteAttendanceDate;
window.selectPaymentStudent = selectPaymentStudent;
window.updateQuickManageStatus = updateQuickManageStatus;
window.openChangePassword = openChangePassword;
window.closeChangePassword = closeChangePassword;
window.cancelAdminEdit = cancelAdminEdit;
window.handlePaymentConfirm = handlePaymentConfirm;
window.handleSavePaymentStatuses = handleSavePaymentStatuses;
window.handleCancelPaymentStatuses = handleCancelPaymentStatuses;
window.mergeStudents = mergeStudents;
window.handleCopyEnrollment = handleCopyEnrollment;
window.storage = storage;

// Initialize date inputs safely
const initDates = () => {
    const enrollDate = document.getElementById('enrollDate');
    const attendDate = document.getElementById('attendDate');
    const importEnrollDate = document.getElementById('importEnrollDate');
    
    if (enrollDate) enrollDate.valueAsDate = new Date();
    if (attendDate) attendDate.valueAsDate = new Date();
    if (importEnrollDate) importEnrollDate.value = new Date().toISOString().split('T')[0];
};

// Event listeners setup
const setupEventListeners = () => {
    // Tab switching
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Student events
    const studentForm = document.getElementById('studentForm');
    const studentCancelBtn = document.getElementById('studentCancelBtn');
    const studentSearch = document.getElementById('studentSearch');
    const studentFilterStatus = document.getElementById('studentFilterStatus');
    const studentFilterCourse = document.getElementById('studentFilterCourse');
    const clearStudentFilters = document.getElementById('clearStudentFilters');
    const deleteFilteredStudents = document.getElementById('deleteFilteredStudents');

    if (studentForm) studentForm.addEventListener('submit', handleStudentSubmit);
    if (studentCancelBtn) studentCancelBtn.addEventListener('click', cancelStudentEdit);
    if (studentSearch) studentSearch.addEventListener('input', () => renderStudentTable());
    if (studentFilterStatus) studentFilterStatus.addEventListener('change', () => renderStudentTable());
    if (studentFilterCourse) studentFilterCourse.addEventListener('change', () => renderStudentTable());
    if (clearStudentFilters) clearStudentFilters.addEventListener('click', clearStudentFilterInputs);
    if (deleteFilteredStudents) deleteFilteredStudents.addEventListener('click', handleDeleteFilteredStudents);

    // Course events
    const courseForm = document.getElementById('courseForm');
    const courseCancelBtn = document.getElementById('courseCancelBtn');
    const courseFilterMonth = document.getElementById('courseFilterMonth');
    const courseFilterStatus = document.getElementById('courseFilterStatus');
    const courseFilterInstructor = document.getElementById('courseFilterInstructor');
    const clearCourseFilters = document.getElementById('clearCourseFilters');
    const quickAddCourseBtn = document.getElementById('quickAddCourseBtn');
    const quickManageMonth = document.getElementById('quickManageMonth');

    if (courseForm) courseForm.addEventListener('submit', handleCourseSubmit);
    if (courseCancelBtn) courseCancelBtn.addEventListener('click', cancelCourseEdit);
    if (courseFilterMonth) courseFilterMonth.addEventListener('change', () => renderCourseTable());
    if (courseFilterStatus) courseFilterStatus.addEventListener('change', () => renderCourseTable());
    if (courseFilterInstructor) courseFilterInstructor.addEventListener('change', () => renderCourseTable());
    if (clearCourseFilters) clearCourseFilters.addEventListener('click', clearCourseFilterInputs);
    if (quickAddCourseBtn) quickAddCourseBtn.addEventListener('click', handleQuickAddCourse);
    if (quickManageMonth) quickManageMonth.addEventListener('change', renderQuickManageTable);

    // Enrollment events
    const enrollmentForm = document.getElementById('enrollmentForm');
    const enrollmentDeleteAllBtn = document.getElementById('enrollmentDeleteAllBtn');
    const enrollStudentSearch = document.getElementById('enrollStudentSearch');
    const enrollFilterCourse = document.getElementById('enrollFilterCourse');
    const enrollSearch = document.getElementById('enrollSearch');
    const clearEnrollFilters = document.getElementById('clearEnrollFilters');
    const enrollmentCancelBtn = document.getElementById('enrollmentCancelBtn');

    if (enrollmentForm) enrollmentForm.addEventListener('submit', handleEnrollment);
    if (enrollmentDeleteAllBtn) enrollmentDeleteAllBtn.addEventListener('click', handleDeleteAllEnrollments);
    if (enrollStudentSearch) {
        enrollStudentSearch.addEventListener('input', handleStudentSearch);
        enrollStudentSearch.addEventListener('focus', handleStudentSearch);
    }
    if (enrollFilterCourse) enrollFilterCourse.addEventListener('change', () => renderEnrollmentTable());
    if (enrollSearch) enrollSearch.addEventListener('input', () => renderEnrollmentTable());
    if (clearEnrollFilters) clearEnrollFilters.addEventListener('click', clearEnrollmentFilterInputs);
    if (enrollmentCancelBtn) enrollmentCancelBtn.addEventListener('click', cancelEnrollmentEdit);

    // Attendance events
    const attendCourse = document.getElementById('attendCourse');
    const attendMonth = document.getElementById('attendMonth');
    const addDateBtn = document.getElementById('addDateBtn');
    const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');

    if (attendCourse) attendCourse.addEventListener('change', () => {
        const course = state.courses.find(c => c.id === attendCourse.value);
        if (course && course.month) {
            const attendMonthEl = document.getElementById('attendMonth');
            if (attendMonthEl) attendMonthEl.value = course.month;
        }
        renderAttendanceMatrix();
    });
    if (attendMonth) attendMonth.addEventListener('change', () => {
        renderAttendanceDropdowns();
        renderAttendanceMatrix();
    });
    if (addDateBtn) addDateBtn.addEventListener('click', handleAddDate);
    if (saveAttendanceBtn) saveAttendanceBtn.addEventListener('click', handleSaveAttendance);

    // Report events
    const reportPeriod = document.getElementById('reportPeriod');
    const reportYear = document.getElementById('reportYear');
    const reportQuarter = document.getElementById('reportQuarter');
    const reportMonth = document.getElementById('reportMonth');

    if (reportPeriod) reportPeriod.addEventListener('change', handleReportPeriodChange);
    if (reportYear) reportYear.addEventListener('change', handleYearChange);
    if (reportQuarter) reportQuarter.addEventListener('change', handleQuarterChange);
    if (reportMonth) reportMonth.addEventListener('change', handleMonthChange);

    // Payment events
    const paymentConfirmBtn = document.getElementById('paymentConfirmBtn');
    const savePaymentStatusesBtn = document.getElementById('savePaymentStatusesBtn');
    const cancelPaymentStatusesBtn = document.getElementById('cancelPaymentStatusesBtn');
    const paymentCourseSelect = document.getElementById('paymentCourseSelect');
    const paymentMonthFilter = document.getElementById('paymentMonthFilter');
    const paymentSelectBtn = document.getElementById('paymentSelectBtn');

    if (paymentConfirmBtn) paymentConfirmBtn.addEventListener('click', handlePaymentConfirm);
    if (savePaymentStatusesBtn) savePaymentStatusesBtn.addEventListener('click', handleSavePaymentStatuses);
    if (cancelPaymentStatusesBtn) cancelPaymentStatusesBtn.addEventListener('click', handleCancelPaymentStatuses);
    if (paymentCourseSelect) paymentCourseSelect.addEventListener('change', () => {
        const course = state.courses.find(c => c.id === paymentCourseSelect.value);
        if (course && course.month) {
            const paymentMonthFilterEl = document.getElementById('paymentMonthFilter');
            if (paymentMonthFilterEl) paymentMonthFilterEl.value = course.month;
        }
    });
    if (paymentMonthFilter) paymentMonthFilter.addEventListener('change', () => {
        paymentCourseSelect.value = '';
        renderPaymentDropdowns(paymentMonthFilter.value);
        const paymentDetailContent = document.getElementById('paymentDetailContent');
        const paymentDetailEmpty = document.getElementById('paymentDetailEmpty');
        if (paymentDetailContent) paymentDetailContent.style.display = 'none';
        if (paymentDetailEmpty) {
            paymentDetailEmpty.style.display = 'block';
            paymentDetailEmpty.textContent = 'Chọn khóa học để xem danh sách học viên.';
        }
    });
    if (paymentSelectBtn) paymentSelectBtn.addEventListener('click', handlePaymentSelect);

    // Auth events
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (changePasswordForm) changePasswordForm.addEventListener('submit', handlePasswordChange);

    // Initialize merge students, copy enrollment, backup/restore, and excel import
    initMergeStudents();
    initCopyEnrollment();
    initBackupRestore();
    initExcelImport();
};

// Backup/Restore initialization
const initBackupRestore = () => {
    const exportBtn = document.getElementById('exportBackupBtn');
    const restoreBtn = document.getElementById('restoreBackupBtn');
    const restoreInput = document.getElementById('restoreFileInput');

    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            if (!state.currentAdmin || state.currentAdmin.role !== 'super') {
                alert('Chỉ Super Admin mới có quyền xuất backup.');
                return;
            }
            await storage.exportBackup();
        });
    }

    if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
            if (!state.currentAdmin || state.currentAdmin.role !== 'super') {
                alert('Chỉ Super Admin mới có quyền khôi phục backup.');
                return;
            }
            if (restoreInput) restoreInput.click();
        });
    }

    if (restoreInput) {
        restoreInput.addEventListener('change', async e => {
            const file = e.target.files[0];
            if (!file) return;

            if (!confirm('⚠️ Khôi phục sẽ XÓA TOÀN BỘ dữ liệu hiện tại và thay thế bằng dữ liệu từ file backup.\n\nTiếp tục?')) {
                restoreInput.value = '';
                return;
            }

            try {
                const result = await storage.importBackup(file);
                alert(`Khôi phục thành công!\n- Học viên: ${result.students}\n- Khóa học: ${result.courses}\n- Ghi danh: ${result.enrollments}\n- Điểm danh: ${result.attendances}\n- Thanh toán: ${result.payments}\n- Quản trị: ${result.admins}`);
                restoreInput.value = '';
            } catch (err) {
                alert('Lỗi khôi phục: ' + err.message);
                restoreInput.value = '';
            }
        });
    }
};

// Excel Import initialization
const initExcelImport = () => {
    const uploadBtn = document.getElementById('uploadExcelBtn');
    const fileInput = document.getElementById('excelFileInput');
    const fileName = document.getElementById('fileName');
    const previewSection = document.getElementById('importPreview');
    const previewCount = document.getElementById('previewCount');
    const previewBody = document.getElementById('previewTableBody');
    const importAllBtn = document.getElementById('importAllBtn');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');

    let parsedStudents = [];

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (fileName) fileName.textContent = file.name;

            try {
                const result = await parseExcelFile(file);
                parsedStudents = result.students;

                if (result.errors.length > 0) {
                    alert('Cảnh báo:\n' + result.errors.slice(0, 5).join('\n') + (result.errors.length > 5 ? `\n...và ${result.errors.length - 5} lỗi khác` : ''));
                }

                if (previewCount) previewCount.textContent = parsedStudents.length;
                renderPreviewTable(parsedStudents, 'previewTableBody', null);

                if (previewSection) previewSection.style.display = 'block';
            } catch (err) {
                alert('Lỗi đọc file: ' + err.message);
                if (fileName) fileName.textContent = 'Chưa chọn file';
                fileInput.value = '';
            }
        });
    }

    if (importAllBtn) {
        importAllBtn.addEventListener('click', async () => {
            if (parsedStudents.length === 0) {
                alert('Không có dữ liệu để import.');
                return;
            }

            const count = await importStudents(parsedStudents);
            alert(`Đã import thành công ${count} học viên!`);

            parsedStudents = [];
            if (previewSection) previewSection.style.display = 'none';
            if (fileInput) fileInput.value = '';
            if (fileName) fileName.textContent = 'Chưa chọn file';

            if (typeof window.renderAll === 'function') await window.renderAll();
        });
    }

    if (cancelImportBtn) {
        cancelImportBtn.addEventListener('click', () => {
            parsedStudents = [];
            if (previewSection) previewSection.style.display = 'none';
            if (fileInput) fileInput.value = '';
            if (fileName) fileName.textContent = 'Chưa chọn file';
        });
    }

    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', generateTemplate);
    }
};

// Initialize
const init = async () => {
    initDates();
    setupEventListeners();
    await storage.init();
    
    const savedSession = sessionStorage.getItem('currentAdmin');
    if (savedSession) {
        state.currentAdmin = JSON.parse(savedSession);
        showApp();
    } else {
        showLogin();
    }

    await renderAll();
};

// Initialize app
init();