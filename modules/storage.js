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
        if (this.useServer) return await api.get('students');
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
        if (this.useServer) return await api.get('courses');
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
        if (this.useServer) return await api.get('enrollments');
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
        if (this.useServer) return await api.get('attendances');
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
        if (this.useServer) return await api.get('payments');
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
        if (this.useServer) return await api.get('admins');
        const data = JSON.parse(localStorage.getItem('admins') || '[]');
        state.admins = data;
        return data;
    }

    async saveAdmins() {
        if (this.useServer) {
            return api.post('admins/batch', state.admins);
        }
        localStorage.setItem('admins', JSON.stringify(state.admins));
    }

    // Backup all data to JSON file
    async exportBackup() {
        const backupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
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
                    if (!data.students || !data.courses || !data.enrollments) {
                        throw new Error('File backup không hợp lệ: thiếu dữ liệu bắt buộc');
                    }

                    // Restore all data
                    state.students = data.students || [];
                    state.courses = data.courses || [];
                    state.enrollments = data.enrollments || [];
                    state.attendances = data.attendances || [];
                    state.paymentRecords = data.paymentRecords || [];
                    state.admins = data.admins || [];

                    // Save to localStorage
                    localStorage.setItem('students', JSON.stringify(state.students));
                    localStorage.setItem('courses', JSON.stringify(state.courses));
                    localStorage.setItem('enrollments', JSON.stringify(state.enrollments));
                    localStorage.setItem('attendances', JSON.stringify(state.attendances));
                    localStorage.setItem('paymentRecords', JSON.stringify(state.paymentRecords));
                    localStorage.setItem('admins', JSON.stringify(state.admins));

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