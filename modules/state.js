// modules/state.js - State management
export const state = {
    students: [],
    courses: [],
    enrollments: [],
    attendances: [],
    paymentRecords: [],
    admins: [],
    currentAdmin: null,
    editingStudentId: null,
    editingCourseId: null,
    editingEnrollmentId: null,
    editingAdminId: null,
    importedStudents: [],
    importEnrollStudents: [],
    paymentSelectedCourseId: null,
    paymentSelectedStudentId: null,
    paymentSelectedMonth: null,
    paymentSelectedStatus: '',

    TAB_KEYS: ['students', 'courses', 'enrollment', 'attendance', 'payment', 'report'],
    TAB_LABELS: { 
        students: 'Học Viên', 
        courses: 'Khóa Học', 
        enrollment: 'Ghi Danh', 
        attendance: 'Điểm Danh', 
        payment: 'Thanh Toán', 
        report: 'Báo Cáo' 
    }
};

export const resetEditStates = () => {
    state.editingStudentId = null;
    state.editingCourseId = null;
    state.editingEnrollmentId = null;
    state.editingAdminId = null;
};