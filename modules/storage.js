// modules/storage.js - Hybrid storage manager
import { state } from './state.js';
import { api } from './api.js';

export class StorageManager {
    constructor() {
        this.useServer = false;
    }

    async init() {
        try {
            const response = await api.get('ping');
            this.useServer = !!response;
        } catch {
            this.useServer = false;
        }
    }

    // Persist students locally (no batch writes any more)
    async saveStudents() {
        localStorage.setItem('students', JSON.stringify(state.students));
    }

    // Persist courses locally (no batch writes any more)
    async saveCourses() {
        localStorage.setItem('courses', JSON.stringify(state.courses));
    }

    // Persist enrollments locally (no batch writes any more)
    async saveEnrollments() {
        localStorage.setItem('enrollments', JSON.stringify(state.enrollments));
    }

    // Persist attendances locally (no batch writes any more)
    async saveAttendances() {
        localStorage.setItem('attendances', JSON.stringify(state.attendances));
    }

    // Persist payment records locally (no batch writes any more)
    async savePaymentRecords() {
        localStorage.setItem('paymentRecords', JSON.stringify(state.paymentRecords));
    }

    // Persist admins locally (no batch writes any more)
    async saveAdmins() {
        localStorage.setItem('admins', JSON.stringify(state.admins));
    }

    async getStudents() {
        if (this.useServer) {
            const data = await api.get('students');
            if (Array.isArray(data)) state.students = data;
            return data;
        }
        const data = JSON.parse(localStorage.getItem('students') || '[]');
        state.students = data;
        return data;
    }

    async addStudent(student) {
        if (this.useServer) {
            return api.post('students', student);
        }
        state.students.push(student);
        await this.saveStudents();
    }

    async updateStudent(student) {
        if (this.useServer) {
            return api.put('students', student.id, student);
        }
        const idx = state.students.findIndex(s => s.id === student.id);
        if (idx !== -1) state.students[idx] = student;
        await this.saveStudents();
    }

    async removeStudent(id) {
        if (this.useServer) {
            return api.delete('students', id);
        }
        state.students = state.students.filter(s => s.id !== id);
        await this.saveStudents();
    }

    async getCourses() {
        if (this.useServer) {
            const data = await api.get('courses');
            if (Array.isArray(data)) state.courses = data;
            return data;
        }
        const data = JSON.parse(localStorage.getItem('courses') || '[]');
        state.courses = data;
        return data;
    }

    async addCourse(course) {
        if (this.useServer) {
            return api.post('courses', course);
        }
        state.courses.push(course);
        await this.saveCourses();
    }

    async updateCourse(course) {
        if (this.useServer) {
            return api.put('courses', course.id, course);
        }
        const idx = state.courses.findIndex(c => c.id === course.id);
        if (idx !== -1) state.courses[idx] = course;
        await this.saveCourses();
    }

    async removeCourse(id) {
        if (this.useServer) {
            return api.delete('courses', id);
        }
        state.courses = state.courses.filter(c => c.id !== id);
        await this.saveCourses();
    }

    async getEnrollments() {
        if (this.useServer) {
            const data = await api.get('enrollments');
            if (Array.isArray(data)) state.enrollments = data;
            return data;
        }
        const data = JSON.parse(localStorage.getItem('enrollments') || '[]');
        state.enrollments = data;
        return data;
    }

    async addEnrollment(enrollment) {
        if (this.useServer) {
            return api.post('enrollments', enrollment);
        }
        state.enrollments.push(enrollment);
        await this.saveEnrollments();
    }

    async updateEnrollment(enrollment) {
        if (this.useServer) {
            return api.put('enrollments', enrollment.id, enrollment);
        }
        const idx = state.enrollments.findIndex(e => e.id === enrollment.id);
        if (idx !== -1) state.enrollments[idx] = enrollment;
        await this.saveEnrollments();
    }

    async removeEnrollment(id) {
        if (this.useServer) {
            return api.delete('enrollments', id);
        }
        state.enrollments = state.enrollments.filter(e => e.id !== id);
        await this.saveEnrollments();
    }

    async getAttendances() {
        if (this.useServer) {
            const data = await api.get('attendances');
            if (Array.isArray(data)) state.attendances = data;
            return data;
        }
        const data = JSON.parse(localStorage.getItem('attendances') || '[]');
        state.attendances = data;
        return data;
    }

    async addAttendance(attendance) {
        if (this.useServer) {
            return api.post('attendances', attendance);
        }
        state.attendances.push(attendance);
        await this.saveAttendances();
    }

    async removeAttendanceByCourseDate(courseId, date) {
        if (this.useServer) {
            // Delete individual records for this course+date
            const toDelete = state.attendances.filter(a => a.courseId === courseId && a.date === date);
            for (const a of toDelete) {
                await api.delete('attendances', a.id);
            }
        }
        state.attendances = state.attendances.filter(a => !(a.courseId === courseId && a.date === date));
        await this.saveAttendances();
    }

    async getPaymentRecords() {
        if (this.useServer) {
            const data = await api.get('payments');
            if (Array.isArray(data)) state.paymentRecords = data;
            return data;
        }
        const data = JSON.parse(localStorage.getItem('paymentRecords') || '[]');
        state.paymentRecords = data;
        return data;
    }

    async addPaymentRecord(record) {
        if (this.useServer) {
            return api.post('payments', record);
        }
        state.paymentRecords.push(record);
        await this.savePaymentRecords();
    }

    async updatePaymentRecord(record) {
        if (this.useServer) {
            return api.put('payments', record.id, record);
        }
        const idx = state.paymentRecords.findIndex(r => r.id === record.id);
        if (idx !== -1) state.paymentRecords[idx] = record;
        await this.savePaymentRecords();
    }

    async removePaymentRecord(id) {
        if (this.useServer) {
            return api.delete('payments', id);
        }
        state.paymentRecords = state.paymentRecords.filter(r => r.id !== id);
        await this.savePaymentRecords();
    }

    async getAdmins() {
        if (this.useServer) {
            const data = await api.get('admins');
            if (Array.isArray(data)) state.admins = data;
            return data;
        }
        const data = JSON.parse(localStorage.getItem('admins') || '[]');
        state.admins = data;
        return data;
    }

    async saveAdmins() {
        localStorage.setItem('admins', JSON.stringify(state.admins));
    }

    // Backup all data to JSON file
    async exportBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async e => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Validate backup structure
                    if (!data || typeof data !== 'object') {
                        throw new Error('File backup không hợp lệ: nội dung không đúng định dạng JSON');
                    }
                    if (!Array.isArray(data.students) || !Array.isArray(data.courses) || !Array.isArray(data.enrollments)) {
                        throw new Error('File backup không hợp lệ: thiếu dữ liệu bắt buộc (students, courses, enrollments)');
                    }

                    // Normalize student fields
                    const students = (data.students || []).map(s => ({
                        id: s.id || '',
                        name: s.name || '',
                        phone: s.phone || '',
                        email: s.email || '',
                        dob: s.dob || '',
                        gender: s.gender || '',
                        address: s.address || '',
                        status: s.status || 'Đang học',
                        discountType: s.discountType || '',
                        discountValue: s.discountValue || 0,
                        createdAt: s.createdAt || new Date().toISOString(),
                        updatedAt: s.updatedAt || null
                    }));

                    // Normalize course fields
                    const courses = (data.courses || []).map(c => ({
                        id: c.id || '',
                        name: c.name || '',
                        instructor: c.instructor || '',
                        month: c.month || 0,
                        fee: c.fee || 0,
                        maxStudents: c.maxStudents || 30,
                        status: c.status || 'Chưa bắt đầu',
                        createdAt: c.createdAt || new Date().toISOString(),
                        updatedAt: c.updatedAt || null
                    }));

                    // Normalize enrollment fields
                    const enrollments = (data.enrollments || []).map(en => ({
                        id: en.id || '',
                        studentId: en.studentId || '',
                        courseId: en.courseId || '',
                        date: en.date || '',
                        discountType: en.discountType || '',
                        discountValue: en.discountValue || 0,
                        createdAt: en.createdAt || new Date().toISOString()
                    }));

                    // Normalize attendance fields
                    const attendances = (data.attendances || []).map(a => ({
                        id: a.id || '',
                        courseId: a.courseId || '',
                        studentId: a.studentId || '',
                        date: a.date || '',
                        present: !!a.present,
                        createdAt: a.createdAt || new Date().toISOString()
                    }));

                    // Normalize payment record fields
                    const paymentRecords = (data.paymentRecords || []).map(p => ({
                        id: p.id || '',
                        studentId: p.studentId || '',
                        courseId: p.courseId || '',
                        month: p.month || '',
                        status: p.status || 'Chưa thanh toán',
                        method: p.method || '',
                        createdAt: p.createdAt || new Date().toISOString(),
                        updatedAt: p.updatedAt || null
                    }));

                    // Normalize admin fields
                    const admins = (data.admins || []).map(a => ({
                        id: a.id || '',
                        username: a.username || '',
                        passwordHash: a.passwordHash || '',
                        name: a.name || '',
                        role: a.role || 'admin',
                        permissions: a.permissions || '{}',
                        createdAt: a.createdAt || new Date().toISOString(),
                        updatedAt: a.updatedAt || null
                    }));

                    // Restore all data to state
                    state.students = students;
                    state.courses = courses;
                    state.enrollments = enrollments;
                    state.attendances = attendances;
                    state.paymentRecords = paymentRecords;
                    state.admins = admins;

                    // Save to localStorage
                    await this.saveStudents();
                    await this.saveCourses();
                    await this.saveEnrollments();
                    await this.saveAttendances();
                    await this.savePaymentRecords();
                    await this.saveAdmins();

                    // Sync to server if using server mode (now individual calls only, sync handled by UI actions)
                    // No batch calls needed – individual operations will sync as they happen

                    // Re-render
                    if (typeof window.renderAll === 'function') {
                        await window.renderAll();
                    }

                    resolve({
                        students: state.students.length,
                        courses: state.courses.length,
                        enrollments: state.enrollments.length,
                        attendances: state.attendances.length,
                        payments: state.paymentRecords.length,
                        admins: state.admins.length
                    });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Không thể đọc file'));
            reader.readAsText(file);
        });
    }
}

export const storage = new StorageManager();