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

    async getStudents() {
        if (this.useServer) {
            const data = await api.get('students');
            if (data) state.students = data;
            return data;
        }
        const data = JSON.parse(localStorage.getItem('students') || '[]');
        state.students = data;
        return data;
    }

    async saveStudents() {
        if (this.useServer) {
            return api.post('students/batch', state.students);
        }
        localStorage.setItem('students', JSON.stringify(state.students));
    }

    async getCourses() {
        if (this.useServer) {
            const data = await api.get('courses');
            if (data) state.courses = data;
            return data;
        }
        const data = JSON.parse(localStorage.getItem('courses') || '[]');
        state.courses = data;
        return data;
    }

    async saveCourses() {
        if (this.useServer) {
            return api.post('courses/batch', state.courses);
        }
        localStorage.setItem('courses', JSON.stringify(state.courses));
    }

    async getEnrollments() {
        if (this.useServer) {
            const data = await api.get('enrollments');
            if (data) state.enrollments = data;
            return data;
        }
        const data = JSON.parse(localStorage.getItem('enrollments') || '[]');
        state.enrollments = data;
        return data;
    }

    async saveEnrollments() {
        if (this.useServer) {
            return api.post('enrollments/batch', state.enrollments);
        }
        localStorage.setItem('enrollments', JSON.stringify(state.enrollments));
    }

    async getAttendances() {
        if (this.useServer) {
            const data = await api.get('attendances');
            if (data) state.attendances = data;
            return data;
        }
        const data = JSON.parse(localStorage.getItem('attendances') || '[]');
        state.attendances = data;
        return data;
    }

    async saveAttendances() {
        if (this.useServer) {
            return api.post('attendances/batch', state.attendances);
        }
        localStorage.setItem('attendances', JSON.stringify(state.attendances));
    }

    async getPaymentRecords() {
        if (this.useServer) {
            const data = await api.get('payments');
            if (data) state.paymentRecords = data;
            return data;
        }
        const data = JSON.parse(localStorage.getItem('paymentRecords') || '[]');
        state.paymentRecords = data;
        return data;
    }

    async savePaymentRecords() {
        if (this.useServer) {
            return api.post('payments/batch', state.paymentRecords);
        }
        localStorage.setItem('paymentRecords', JSON.stringify(state.paymentRecords));
    }

    async getAdmins() {
        if (this.useServer) {
            const data = await api.get('admins');
            if (data) state.admins = data;
            return data;
        }
        const data = JSON.parse(localStorage.getItem('admins') || '[]');
        state.admins = data;
        return data;
    }

    async saveAdmins() {
        if (this.useServer) {
            // Sync each admin individually via PUT (batch endpoint not available)
            for (const admin of state.admins) {
                await api.put('admins', admin.id, {
                    username: admin.username,
                    name: admin.name,
                    role: admin.role,
                    permissions: admin.permissions,
                    passwordHash: admin.passwordHash
                });
            }
            return;
        }
        localStorage.setItem('admins', JSON.stringify(state.admins));
    }

    // Backup all data to JSON file
    async exportBackup() {
        const backupData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            students: state.students,
            courses: state.courses,
            enrollments: state.enrollments,
            attendances: state.attendances,
            paymentRecords: state.paymentRecords,
            admins: state.admins
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Restore all data from JSON file
    async importBackup(file) {
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
                    localStorage.setItem('students', JSON.stringify(state.students));
                    localStorage.setItem('courses', JSON.stringify(state.courses));
                    localStorage.setItem('enrollments', JSON.stringify(state.enrollments));
                    localStorage.setItem('attendances', JSON.stringify(state.attendances));
                    localStorage.setItem('paymentRecords', JSON.stringify(state.paymentRecords));
                    localStorage.setItem('admins', JSON.stringify(state.admins));

                    // Sync to server if using server mode
                    if (this.useServer) {
                        try {
                            await api.post('students/batch', state.students);
                            await api.post('courses/batch', state.courses);
                            await api.post('enrollments/batch', state.enrollments);
                            await api.post('attendances/batch', state.attendances);
                            await api.post('payments/batch', state.paymentRecords);
                        } catch (serverErr) {
                            console.warn('Server sync failed after restore, data saved to localStorage only:', serverErr);
                        }
                    }

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