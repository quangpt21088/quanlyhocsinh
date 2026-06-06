// test-modules.js - Test all module imports and basic functionality
// Run with: node test-modules.js

// Mock browser globals BEFORE any imports
global.window = {
    location: { origin: 'http://localhost' },
    API_BASE: 'http://localhost/api'
};
global.document = {
    getElementById: (id) => {
        // Return mock elements for common IDs
        const mocks = {
            loginOverlay: { style: {} },
            appLayout: { style: {} },
            loginError: { textContent: '' },
            loginUsername: { value: '' },
            loginPassword: { value: '' },
            currentUserName: { textContent: '' },
            navAdmin: { style: {} },
            importEnrollDate: { value: '' },
            enrollDate: { value: '', valueAsDate: null },
            attendDate: { value: '', valueAsDate: null },
            studentSearch: { value: '' },
            studentFilterStatus: { value: '' },
            studentFilterCourse: { value: '' },
            clearStudentFilters: { addEventListener: () => {}, style: {} },
            deleteFilteredStudents: { style: {} },
            studentForm: { addEventListener: () => {}, reset: () => {}, scrollIntoView: () => {} },
            studentCancelBtn: { addEventListener: () => {}, style: {} },
            studentSubmitBtn: { textContent: '' },
            studentFormTitle: { textContent: '' },
            studentTableBody: { innerHTML: '' },
            studentEmptyMessage: { style: {} },
            studentDetailModal: { style: {} },
            studentDetailBody: { innerHTML: '' },
            totalStudents: { textContent: '0' },
            activeStudents: { textContent: '0' },
            totalCourses: { textContent: '0' },
            // Course elements
            courseForm: { addEventListener: () => {}, reset: () => {}, scrollIntoView: () => {} },
            courseCancelBtn: { addEventListener: () => {}, style: {} },
            courseSubmitBtn: { textContent: '' },
            courseFormTitle: { textContent: '' },
            courseTableBody: { innerHTML: '' },
            courseEmptyMessage: { style: {} },
            courseFilterMonth: { value: '', addEventListener: () => {}, style: {} },
            courseFilterStatus: { value: '', addEventListener: () => {}, style: {} },
            courseFilterInstructor: { value: '', innerHTML: '', addEventListener: () => {} },
            clearCourseFilters: { addEventListener: () => {} },
            quickAddCourseBtn: { addEventListener: () => {} },
            quickAddSourceCourse: { value: '', innerHTML: '' },
            quickAddMonth: { value: '' },
            quickManageMonth: { value: '' },
            quickManageSection: { style: {} },
            quickManageTableBody: { innerHTML: '' },
            quickManageEmpty: { style: {} },
            // Enrollment elements
            enrollmentForm: { addEventListener: () => {}, reset: () => {}, scrollIntoView: () => {} },
            enrollmentCancelBtn: { addEventListener: () => {}, style: {} },
            enrollmentSubmitBtn: { textContent: '' },
            enrollmentFormTitle: { textContent: '' },
            enrollmentTableBody: { innerHTML: '' },
            enrollmentEmptyMessage: { style: {} },
            enrollmentDeleteAllBtn: { addEventListener: () => {} },
            enrollmentDeleteAllWrap: { style: {} },
            enrollStudent: { value: '' },
            enrollStudentSearch: { value: '', addEventListener: () => {}, disabled: false },
            enrollStudentDropdown: { style: {}, innerHTML: '' },
            enrollCourse: { value: '', innerHTML: '', disabled: false },
            enrollFilterCourse: { value: '', innerHTML: '' },
            enrollSearch: { value: '' },
            clearEnrollFilters: { addEventListener: () => {} },
            discountType: { value: '' },
            discountValue: { value: '', disabled: true },
            enrollMonth: { value: '' },
            // Attendance elements
            attendCourse: { value: '', innerHTML: '', addEventListener: () => {} },
            attendMonth: { value: '' },
            attendDate: { value: '', valueAsDate: null },
            addDateBtn: { addEventListener: () => {} },
            saveAttendanceBtn: { addEventListener: () => {} },
            attendanceMatrixSection: { style: {} },
            attendanceMatrixTitle: { textContent: '' },
            attendanceMatrixHead: { innerHTML: '' },
            attendanceMatrixBody: { innerHTML: '' },
            attendanceEmptyMessage: { style: {}, textContent: '' },
            // Payment elements
            paymentCourseSelect: { value: '', innerHTML: '', addEventListener: () => {}, style: {} },
            paymentStatusFilter: { value: '' },
            paymentMonthFilter: { value: '', addEventListener: () => {}, style: {} },
            paymentSelectBtn: { addEventListener: () => {} },
            paymentStudentTitle: { textContent: '' },
            paymentStudentTableBody: { innerHTML: '' },
            paymentStudentEmpty: { style: {}, textContent: '' },
            paymentDetailTitle: { textContent: '' },
            paymentDetailContent: { style: {} },
            paymentDetailEmpty: { style: {}, textContent: '' },
            paymentStudentInfo: { innerHTML: '' },
            paymentAttendanceBody: { innerHTML: '' },
            paymentSummary: { innerHTML: '' },
            paymentStatusSelect: { value: '' },
            paymentMethodSelect: { value: '' },
            paymentConfirmBtn: { addEventListener: () => {} },
            paymentStatusActions: { style: {} },
            savePaymentStatusesBtn: { addEventListener: () => {} },
            cancelPaymentStatusesBtn: { addEventListener: () => {} },
            // Report elements
            reportPeriod: { value: 'quarter', addEventListener: () => {}, style: {} },
            reportYear: { value: '', innerHTML: '' },
            reportQuarter: { value: '', innerHTML: '' },
            reportMonth: { value: '', innerHTML: '' },
            reportSummary: { style: {} },
            reportTotalRevenue: { textContent: '' },
            reportTotalStudents: { textContent: '' },
            reportTotalSessions: { textContent: '' },
            reportTotalDiscount: { textContent: '' },
            reportCourseSection: { style: {} },
            reportCourseBody: { innerHTML: '' },
            reportStudentSection: { style: {} },
            reportStudentTitle: { textContent: '' },
            reportStudentBody: { innerHTML: '' },
            reportEmpty: { style: {} },
            reportCourseInput: { addEventListener: () => {} },
            reportCourseText: { textContent: '' },
            reportCourseDropdown: { classList: { toggle: () => {} } },
            reportCourseOptions: { innerHTML: '' },
            // Admin elements
            loginForm: { addEventListener: () => {} },
            logoutBtn: { addEventListener: () => {} },
            adminForm: { addEventListener: () => {}, reset: () => {}, scrollIntoView: () => {} },
            adminCancelBtn: { addEventListener: () => {}, style: {} },
            adminSubmitBtn: { textContent: '' },
            adminFormTitle: { textContent: '' },
            adminTableBody: { innerHTML: '' },
            adminEmptyMessage: { style: {} },
            changePasswordModal: { style: {} },
            changePasswordForm: { addEventListener: () => {} },
            changePasswordInfo: { textContent: '' },
            changePasswordError: { textContent: '' },
            newPassword: { value: '' },
            confirmPassword: { value: '' },
            permissionMatrix: { querySelectorAll: () => [] },
        };
        return mocks[id] || { style: {}, value: '', innerHTML: '', textContent: '', appendChild: () => {}, classList: { toggle: () => {}, remove: () => {}, add: () => {} }, addEventListener: () => {}, removeEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [], contains: () => false, closest: () => null };
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: (tag) => ({
        tagName: tag,
        innerHTML: '',
        style: {},
        appendChild: () => {},
        addEventListener: () => {},
        setAttribute: () => {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        querySelector: () => null,
        querySelectorAll: () => [],
        insertAdjacentElement: () => {},
        remove: () => {},
    }),
    body: { appendChild: () => {}, removeChild: () => {}, classList: { add: () => {}, remove: () => {} } },
    createTextNode: () => ({}),
};
global.localStorage = {
    _data: {},
    getItem: (key) => global.localStorage._data[key] || null,
    setItem: (key, val) => { global.localStorage._data[key] = String(val); },
    removeItem: (key) => { delete global.localStorage._data[key]; },
};
global.sessionStorage = {
    _data: {},
    getItem: (key) => global.sessionStorage._data[key] || null,
    setItem: (key, val) => { global.sessionStorage._data[key] = String(val); },
    removeItem: (key) => { delete global.sessionStorage._data[key]; },
};
global.crypto = {
    subtle: {
        digest: async (algo, data) => {
            const buf = new Uint8Array(32);
            for (let i = 0; i < Math.min(data.length, 32); i++) buf[i] = data[i];
            return buf.buffer;
        }
    }
};
global.confirm = () => true;
global.alert = () => {};
global.scrollTo = () => {};
global.scrollIntoView = () => {};
global.Math = Math;
global.Date = Date;
global.Array = Array;
global.Object = Object;
global.String = String;
global.Number = Number;
global.parseInt = parseInt;
global.parseFloat = parseFloat;
global.isNaN = isNaN;
global.encodeURIComponent = encodeURIComponent;
global.console = console;

// Now run async test
async function runTests() {
    const results = [];
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            results.push(`✅ ${name}`);
            passed++;
        } catch (err) {
            results.push(`❌ ${name}: ${err.message}`);
            failed++;
        }
    }

    try {
        // Test 1: state.js
        const { state, resetEditStates } = await import('./modules/state.js');
        test('state.js import', () => {
            if (!state) throw new Error('state is undefined');
            if (!Array.isArray(state.students)) throw new Error('state.students is not array');
            if (!Array.isArray(state.courses)) throw new Error('state.courses is not array');
            if (typeof resetEditStates !== 'function') throw new Error('resetEditStates is not function');
        });

        // Test 2: utils.js
        const { formatCurrency, formatDate, getStatusClass, escapeHtml, formatCourseName, getStudentCourseCount, getCourseEnrollmentCount, getStudentCourses, getCourseAttendanceDates } = await import('./modules/utils.js');
        test('utils.js import', () => {
            if (typeof formatCurrency !== 'function') throw new Error('formatCurrency not function');
        });
        test('formatCurrency()', () => {
            const result = formatCurrency(1000000);
            if (!result.includes('₫')) throw new Error('Missing ₫ symbol: ' + result);
        });
        test('formatDate()', () => {
            const result = formatDate('2026-01-15');
            if (result === '-') throw new Error('Invalid date return');
        });
        test('getStatusClass()', () => {
            if (getStatusClass('Đang học') !== 'status-active') throw new Error('Wrong class');
            if (getStatusClass('Unknown') !== '') throw new Error('Should return empty for unknown');
        });
        test('formatCourseName()', () => {
            const result = formatCourseName({ name: 'Test', month: 6 });
            if (!result.includes('Tháng 6')) throw new Error('Missing month: ' + result);
        });
        test('escapeHtml()', () => {
            const result = escapeHtml('<script>');
            if (result.includes('<script>')) throw new Error('Not escaped');
        });

        // Test 3: api.js
        const { api } = await import('./modules/api.js');
        test('api.js import', () => {
            if (!api) throw new Error('api is undefined');
        });

        // Test 4: storage.js
        const { storage } = await import('./modules/storage.js');
        test('storage.js import', () => {
            if (!storage) throw new Error('storage is undefined');
            if (typeof storage.getStudents !== 'function') throw new Error('getStudents not function');
            if (typeof storage.saveStudents !== 'function') throw new Error('saveStudents not function');
        });

        // Test 5: ui.js
        const { switchTab, showLogin, showApp, applyPermissions } = await import('./modules/ui.js');
        test('ui.js import', () => {
            if (typeof switchTab !== 'function') throw new Error('switchTab not function');
            if (typeof showLogin !== 'function') throw new Error('showLogin not function');
        });

        // Test 6: auth.js
        const { checkPermission, handleLogin, handleLogout, openChangePassword, closeChangePassword, handlePasswordChange } = await import('./modules/auth.js');
        test('auth.js import', () => {
            if (typeof checkPermission !== 'function') throw new Error('checkPermission not function');
            if (typeof openChangePassword !== 'function') throw new Error('openChangePassword not function');
            if (typeof closeChangePassword !== 'function') throw new Error('closeChangePassword not function');
            if (typeof handlePasswordChange !== 'function') throw new Error('handlePasswordChange not function');
        });
        test('checkPermission() logic', () => {
            state.currentAdmin = { role: 'super' };
            if (!checkPermission('students', 'view')) throw new Error('Super should have all permissions');
            state.currentAdmin = null;
            if (checkPermission('students', 'view')) throw new Error('Null admin should have no permissions');
        });

        // Test 7: student.js
        const { deleteStudent, startStudentEdit, cancelStudentEdit, showStudentDetail, closeStudentDetailModal, clearStudentFilterInputs } = await import('./modules/student.js');
        test('student.js import', () => {
            if (typeof deleteStudent !== 'function') throw new Error('deleteStudent not function');
            if (typeof showStudentDetail !== 'function') throw new Error('showStudentDetail not function');
            if (typeof closeStudentDetailModal !== 'function') throw new Error('closeStudentDetailModal not function');
            if (typeof clearStudentFilterInputs !== 'function') throw new Error('clearStudentFilterInputs not function');
        });

        // Test 8: course.js
        const { deleteCourse, startCourseEdit, cancelCourseEdit, renderCourseTable, handleQuickAddCourse, renderQuickManageTable, updateQuickManageStatus } = await import('./modules/course.js');
        test('course.js import', () => {
            if (typeof deleteCourse !== 'function') throw new Error('deleteCourse not function');
            if (typeof handleQuickAddCourse !== 'function') throw new Error('handleQuickAddCourse not function');
            if (typeof updateQuickManageStatus !== 'function') throw new Error('updateQuickManageStatus not function');
        });

        // Test 9: enrollment.js
        const { handleEnrollment, renderEnrollmentTable, removeEnrollment, renderEnrollmentDropdowns, handleDeleteAllEnrollments, clearEnrollmentFilterInputs } = await import('./modules/enrollment.js');
        test('enrollment.js import', () => {
            if (typeof handleEnrollment !== 'function') throw new Error('handleEnrollment not function');
            if (typeof handleDeleteAllEnrollments !== 'function') throw new Error('handleDeleteAllEnrollments not function');
        });

        // Test 10: attendance.js
        const { renderAttendanceDropdowns, renderAttendanceMatrix, handleAddDate, handleSaveAttendance, deleteAttendanceDate } = await import('./modules/attendance.js');
        test('attendance.js import', () => {
            if (typeof handleAddDate !== 'function') throw new Error('handleAddDate not function');
            if (typeof handleSaveAttendance !== 'function') throw new Error('handleSaveAttendance not function');
        });

        // Test 11: payment.js
        const { renderPaymentDropdowns, handlePaymentSelect, renderPaymentStudents, renderPaymentDetails, selectPaymentStudent, handlePaymentConfirm, handleSavePaymentStatuses, handleCancelPaymentStatuses } = await import('./modules/payment.js');
        test('payment.js import', () => {
            if (typeof handlePaymentConfirm !== 'function') throw new Error('handlePaymentConfirm not function');
            if (typeof handleSavePaymentStatuses !== 'function') throw new Error('handleSavePaymentStatuses not function');
            if (typeof handleCancelPaymentStatuses !== 'function') throw new Error('handleCancelPaymentStatuses not function');
        });

        // Test 12: report.js
        const { renderReportDropdowns, handleReportPeriodChange, renderReport, handleYearChange, handleMonthChange, handleQuarterChange } = await import('./modules/report.js');
        test('report.js import', () => {
            if (typeof handleReportPeriodChange !== 'function') throw new Error('handleReportPeriodChange not function');
            if (typeof handleYearChange !== 'function') throw new Error('handleYearChange not function');
            if (typeof handleMonthChange !== 'function') throw new Error('handleMonthChange not function');
            if (typeof handleQuarterChange !== 'function') throw new Error('handleQuarterChange not function');
        });

        // Test 13: admin.js
        const { renderAdminTable, startAdminEdit, cancelAdminEdit, deleteAdmin } = await import('./modules/admin.js');
        test('admin.js import', () => {
            if (typeof renderAdminTable !== 'function') throw new Error('renderAdminTable not function');
            if (typeof startAdminEdit !== 'function') throw new Error('startAdminEdit not function');
            if (typeof cancelAdminEdit !== 'function') throw new Error('cancelAdminEdit not function');
        });

        // Test 14: render-all.js
        const { renderAll, renderSummary } = await import('./modules/render-all.js');
        test('render-all.js import', () => {
            if (typeof renderAll !== 'function') throw new Error('renderAll not function');
            if (typeof renderSummary !== 'function') throw new Error('renderSummary not function');
        });

        // Test 15: State operations
        test('state operations', () => {
            state.students = [{ id: '1', name: 'Test Student', phone: '0123', status: 'Đang học' }];
            state.courses = [{ id: '1', name: 'Test Course', instructor: 'GV', month: 6, fee: 100000, maxStudents: 30, status: 'Đang mở' }];
            state.enrollments = [];
            state.attendances = [];
            state.paymentRecords = [];
            state.admins = [{ id: '1', username: 'admin', passwordHash: 'hash', name: 'Admin', role: 'super' }];
            if (state.students.length !== 1) throw new Error('Students not saved');
        });

        // Test 16: utils with data
        test('getStudentCourseCount()', () => {
            state.enrollments = [{ studentId: '1', courseId: '1' }];
            const count = getStudentCourseCount('1');
            if (count !== 1) throw new Error('Expected 1, got ' + count);
        });

        test('getCourseEnrollmentCount()', () => {
            const count = getCourseEnrollmentCount('1');
            if (count !== 1) throw new Error('Expected 1, got ' + count);
        });

        // Reset state
        resetEditStates();
        state.students = [];
        state.courses = [];
        state.enrollments = [];
        state.attendances = [];
        state.paymentRecords = [];
        state.admins = [];

    } catch (err) {
        results.push(`❌ CRITICAL: ${err.message}`);
        failed++;
    }

    console.log('\n=== TEST RESULTS ===');
    results.forEach(r => console.log(r));
    console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    if (failed > 0) process.exit(1);
}

runTests();
