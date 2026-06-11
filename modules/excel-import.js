// modules/excel-import.js - Excel/CSV Import Module (browser-compatible)
// Uses SheetJS (XLSX) loaded via CDN in index.html + FileReader API
import { state } from './state.js';
import { storage } from './storage.js';
import { api } from './api.js';
import { escapeHtml, generateId } from './utils.js';

const REQUIRED_FIELDS = ['STT', 'Họ Tên'];
const OPTIONAL_FIELDS = ['Ngày Sinh', 'Giới Tính', 'Số Điện Thoại', 'Email', 'Địa Chỉ', 'Ưu Đãi'];

const normalizeHeader = header => {
    if (!header) return '';
    return header.toString().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]/g, '');
};

const HEADER_MAP = {
    'stt': 'stt',
    'so': 'stt',
    'sothutu': 'stt',
    'hoten': 'hoTen',
    'ho': 'hoTen',
    'ten': 'hoTen',
    'hovaten': 'hoTen',
    'ngaysinh': 'ngaySinh',
    'sinh': 'ngaySinh',
    'gioitinh': 'gioiTinh',
    'gioi': 'gioiTinh',
    'sodienthoai': 'soDienThoai',
    'sdt': 'soDienThoai',
    'dienthoai': 'soDienThoai',
    'email': 'email',
    'thudien': 'email',
    'diachi': 'diaChi',
    'dia': 'diaChi',
    'uudai': 'uuDai',
    'giamgia': 'uuDai',
};

const parseRow = (rawRow) => {
    const row = {};
    const rawKeys = Object.keys(rawRow);

    rawKeys.forEach(rawKey => {
        const normalized = normalizeHeader(rawKey);
        const mappedKey = HEADER_MAP[normalized];
        if (mappedKey) {
            row[mappedKey] = rawRow[rawKey];
        } else {
            row[rawKey] = rawRow[rawKey];
        }
    });

    return row;
};

const validateRow = (row, rowIndex) => {
    const errors = [];
    REQUIRED_FIELDS.forEach(field => {
        const normalized = normalizeHeader(field);
        const mappedKey = HEADER_MAP[normalized];
        const value = mappedKey ? row[mappedKey] : row[field];
        if (!value || value.toString().trim() === '') {
            errors.push(`Dòng ${rowIndex}: Thiếu "${field}"`);
        }
    });
    return errors;
};

const parseDateValue = (val) => {
    if (!val) return '';
    if (val instanceof Date) {
        return val.toISOString().split('T')[0];
    }
    const str = val.toString().trim();
    const ddmmyyyy = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (ddmmyyyy) {
        const [, dd, mm, yyyy] = ddmmyyyy;
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    const yyyymmdd = str.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
    if (yyyymmdd) {
        const [, yyyy, mm, dd] = yyyymmdd;
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    return str;
};

const rowToStudent = (row) => {
    const hoTen = (row.hoTen || row['Họ Tên'] || '').toString().trim();
    const soDienThoai = (row.soDienThoai || row['Số Điện Thoại'] || row.SDT || row.sdt || '').toString().trim();
    const email = (row.email || row.Email || '').toString().trim();
    const ngaySinh = parseDateValue(row.ngaySinh || row['Ngày Sinh'] || '');
    const gioiTinh = (row.gioiTinh || row['Giới Tính'] || '').toString().trim();
    const diaChi = (row.diaChi || row['Địa Chỉ'] || '').toString().trim();
    const uuDai = (row.uuDai || row['Ưu Đãi'] || '').toString().trim();

    return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: hoTen,
        phone: soDienThoai,
        email: email,
        dob: ngaySinh,
        gender: gioiTinh,
        address: diaChi,
        status: 'Đang học',
        discountType: '',
        discountValue: 0,
        createdAt: new Date().toISOString()
    };
};

export const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        if (typeof XLSX === 'undefined') {
            reject(new Error('Thư viện SheetJS (XLSX) chưa được tải. Vui lòng tải lại trang.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

                if (rawRows.length === 0) {
                    reject(new Error('File không có dữ liệu hoặc định dạng không hợp lệ.'));
                    return;
                }

                const parsedRows = rawRows.map(row => parseRow(row));
                const allErrors = [];
                parsedRows.forEach((row, idx) => {
                    const errs = validateRow(row, idx + 2);
                    allErrors.push(...errs);
                });

                const students = parsedRows.map(row => rowToStudent(row));

                resolve({ students, errors: allErrors, totalRows: rawRows.length });
            } catch (err) {
                reject(new Error('Lỗi đọc file: ' + err.message));
            }
        };
        reader.onerror = () => reject(new Error('Không thể đọc file.'));
        reader.readAsArrayBuffer(file);
    });
};

export const renderPreviewTable = (students, containerId, emptyId) => {
    const tbody = document.getElementById(containerId);
    const emptyMsg = document.getElementById(emptyId);
    if (!tbody) return;

    tbody.innerHTML = '';

    if (students.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    students.forEach((student, index) => {
        const tr = document.createElement('tr');
        tr.dataset.index = index;
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><input type="text" class="preview-edit-input" data-field="name" value="${escapeHtml(student.name)}" style="min-width:120px;"></td>
            <td><input type="text" class="preview-edit-input" data-field="dob" value="${escapeHtml(student.dob || '')}" style="min-width:90px;"></td>
            <td><input type="text" class="preview-edit-input" data-field="gender" value="${escapeHtml(student.gender || '')}" style="min-width:60px;"></td>
            <td><input type="text" class="preview-edit-input" data-field="phone" value="${escapeHtml(student.phone)}" style="min-width:100px;"></td>
            <td><input type="text" class="preview-edit-input" data-field="email" value="${escapeHtml(student.email || '')}" style="min-width:120px;"></td>
            <td><input type="text" class="preview-edit-input" data-field="address" value="${escapeHtml(student.address || '')}" style="min-width:100px;"></td>
            <td>-</td>
            <td><button class="btn btn-danger btn-sm" data-action="remove" data-index="${index}">Xóa</button></td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-action="remove"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            const row = btn.closest('tr');
            row.remove();
        });
    });
};

export const getEditedStudents = (containerId) => {
    const tbody = document.getElementById(containerId);
    if (!tbody) return [];
    const rows = tbody.querySelectorAll('tr');
    const students = [];
    rows.forEach(row => {
        const index = parseInt(row.dataset.index);
        const inputs = row.querySelectorAll('.preview-edit-input');
        const edits = {};
        inputs.forEach(input => {
            edits[input.dataset.field] = input.value.trim();
        });
        students.push({ index, edits });
    });
    return students;
};

export const importStudents = async (students) => {
    let importedCount = 0;
    for (const student of students) {
        const phone = student.phone || '';
        // Skip duplicate by phone
        if (phone && state.students.some(s => s.phone === phone)) continue;

        const newId = generateId('st_');
        state.students.push({ ...student, id: newId });
        importedCount++;

        if (storage.useServer) {
            try {
                await api.post('students', { ...student, id: newId });
            } catch (err) {
                console.error('Error creating student via API:', err);
            }
        }
    }

    if (!storage.useServer && importedCount > 0) {
        await storage.saveStudents();
    }

    return importedCount;
};

export const generateTemplate = () => {
    if (typeof XLSX === 'undefined') {
        alert('Thư viện SheetJS chưa được tải. Vui lòng tải lại trang.');
        return;
    }

    const templateData = [
        {
            'STT': 1,
            'Họ Tên': 'Nguyễn Văn A',
            'Ngày Sinh': '01/01/2000',
            'Giới Tính': 'Nam',
            'Số Điện Thoại': '0901234567',
            'Email': 'nguyenvana@email.com',
            'Địa Chỉ': 'Hà Nội',
            'Ưu Đãi': ''
        },
        {
            'STT': 2,
            'Họ Tên': 'Trần Thị B',
            'Ngày Sinh': '15/05/2001',
            'Giới Tính': 'Nữ',
            'Số Điện Thoại': '0912345678',
            'Email': 'tranthib@email.com',
            'Địa Chỉ': 'TP.HCM',
            'Ưu Đãi': '10%'
        }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách học viên');

    ws['!cols'] = [
        { wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 10 },
        { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 10 }
    ];

    XLSX.writeFile(wb, 'Mau_danh_sach_hoc_vien.xlsx');
};

// ===== Import & Enroll (Import students and enroll them into a course) =====

export const initImportEnroll = () => {
    const uploadBtn = document.getElementById('uploadImportEnrollBtn');
    const fileInput = document.getElementById('importEnrollFileInput');
    const fileName = document.getElementById('importEnrollFileName');
    const previewSection = document.getElementById('importEnrollPreview');
    const previewCount = document.getElementById('importEnrollPreviewCount');
    const previewBody = document.getElementById('importEnrollPreviewBody');
    const importAllBtn = document.getElementById('importEnrollAllBtn');
    const cancelBtn = document.getElementById('cancelImportEnrollBtn');
    const downloadTemplateBtn = document.getElementById('downloadImportEnrollTemplateBtn');
    const monthSelect = document.getElementById('importEnrollMonth');
    const courseSelect = document.getElementById('importEnrollCourse');

    const renderImportEnrollCourseDropdown = () => {
        if (!courseSelect || !monthSelect) return;
        const selectedMonth = monthSelect.value ? parseInt(monthSelect.value) : null;
        const currentCourse = courseSelect.value;
        courseSelect.innerHTML = '<option value="">Chọn khóa học</option>';
        if (!selectedMonth) return;
        const courses = state.courses.filter(c => c.status === 'Đang mở' && c.month === selectedMonth);
        courses.forEach(c => {
            const enrolled = state.enrollments ? state.enrollments.filter(e => e.courseId === c.id).length : 0;
            if (!c.maxStudents || enrolled < c.maxStudents) {
                courseSelect.innerHTML += `<option value="${c.id}">${c.name} (${enrolled}/${c.maxStudents || '-'})</option>`;
            }
        });
        courseSelect.value = currentCourse;
    };

    if (monthSelect) {
        monthSelect.addEventListener('change', () => {
            courseSelect.value = '';
            renderImportEnrollCourseDropdown();
        });
    }

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
                state.importEnrollStudents = result.students;

                if (result.errors.length > 0) {
                    alert('Cảnh báo:\n' + result.errors.slice(0, 5).join('\n') + (result.errors.length > 5 ? `\n...và ${result.errors.length - 5} lỗi khác` : ''));
                }

                if (previewCount) previewCount.textContent = state.importEnrollStudents.length;

                // Render preview
                if (previewBody) {
                    previewBody.innerHTML = '';
                    state.importEnrollStudents.forEach((student, index) => {
                        const tr = document.createElement('tr');
                        tr.dataset.index = index;
                        tr.innerHTML = `
                            <td>${index + 1}</td>
                            <td><input type="text" class="preview-edit-input" data-field="name" value="${escapeHtml(student.name)}" style="min-width:120px;"></td>
                            <td><input type="text" class="preview-edit-input" data-field="dob" value="${escapeHtml(student.dob || '')}" style="min-width:90px;"></td>
                            <td><input type="text" class="preview-edit-input" data-field="gender" value="${escapeHtml(student.gender || '')}" style="min-width:60px;"></td>
                            <td><input type="text" class="preview-edit-input" data-field="phone" value="${escapeHtml(student.phone)}" style="min-width:100px;"></td>
                            <td><input type="text" class="preview-edit-input" data-field="email" value="${escapeHtml(student.email || '')}" style="min-width:120px;"></td>
                            <td><input type="text" class="preview-edit-input" data-field="address" value="${escapeHtml(student.address || '')}" style="min-width:100px;"></td>
                            <td>-</td>
                            <td><button class="btn btn-danger btn-sm" data-action="remove-enroll" data-index="${index}">Xóa</button></td>
                        `;
                        previewBody.appendChild(tr);
                    });
                    previewBody.querySelectorAll('button[data-action="remove-enroll"]').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const idx = parseInt(btn.dataset.index);
                            state.importEnrollStudents.splice(idx, 1);
                            btn.closest('tr').remove();
                            if (previewCount) previewCount.textContent = state.importEnrollStudents.length;
                        });
                    });
                }

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
            if (!state.importEnrollStudents || state.importEnrollStudents.length === 0) {
                alert('Không có dữ liệu để import.');
                return;
            }

            const courseId = courseSelect?.value;
            if (!courseId) {
                alert('Vui lòng chọn khóa học ghi danh.');
                return;
            }

            const enrollDate = document.getElementById('importEnrollDate')?.value;
            if (!enrollDate) {
                alert('Vui lòng chọn ngày ghi danh.');
                return;
            }

            const course = state.courses.find(c => c.id === courseId);
            if (!course) {
                alert('Không tìm thấy khóa học.');
                return;
            }

            let importedCount = 0;
            let enrolledCount = 0;
            const enrollErrors = [];

            for (const studentData of state.importEnrollStudents) {
                const phone = studentData.phone || '';
                let existingStudent = phone ? state.students.find(s => s.phone === phone) : null;
                let studentId;

                if (existingStudent) {
                    studentId = existingStudent.id;
                } else {
                    studentId = generateId('st_');
                    const newStudent = {
                        id: studentId,
                        name: studentData.name || '',
                        phone: phone,
                        email: studentData.email || '',
                        dob: studentData.dob || '',
                        gender: studentData.gender || '',
                        address: studentData.address || '',
                        status: 'Đang học',
                        discountType: '',
                        discountValue: 0,
                        createdAt: new Date().toISOString()
                    };
                    state.students.push(newStudent);
                    importedCount++;

                    if (storage.useServer) {
                        try {
                            await api.post('students', newStudent);
                        } catch (err) {
                            enrollErrors.push(`Lỗi tạo học viên "${studentData.name}": ${err.message}`);
                        }
                    }
                }

                // Check capacity
                const currentEnrolled = state.enrollments.filter(e => e.courseId === courseId).length + enrolledCount;
                if (course.maxStudents && currentEnrolled >= course.maxStudents) {
                    enrollErrors.push(`Khóa học "${course.name}" đã đầy, bỏ qua học viên "${studentData.name}".`);
                    continue;
                }

                // Check duplicate enrollment (in state + check server-side via unique constraint)
                const alreadyEnrolled = state.enrollments.some(e => e.studentId === studentId && e.courseId === courseId);
                if (alreadyEnrolled) continue;

                const enrollmentId = generateId('en_');
                state.enrollments.push({
                    id: enrollmentId,
                    studentId,
                    courseId,
                    date: enrollDate,
                    discountType: '',
                    discountValue: 0,
                    createdAt: new Date().toISOString()
                });
                enrolledCount++;

                if (storage.useServer) {
                    try {
                        await api.post('enrollments', {
                            id: enrollmentId,
                            studentId,
                            courseId,
                            date: enrollDate,
                            discountType: '',
                            discountValue: 0,
                            createdAt: new Date().toISOString()
                        });
                    } catch (err) {
                        enrollErrors.push(`Lỗi ghi danh "${studentData.name}": ${err.message}`);
                    }
                }
            }

            // Batch save for offline mode
            if (!storage.useServer) {
                if (importedCount > 0) await storage.saveStudents();
                if (enrolledCount > 0) await storage.saveEnrollments();
            }

            let msg = `Hoàn tất!\n- Học viên mới được thêm: ${importedCount}\n- Ghi danh thành công: ${enrolledCount}`;
            if (enrollErrors.length > 0) {
                msg += `\n\nCảnh báo:\n` + enrollErrors.slice(0, 5).join('\n') + (enrollErrors.length > 5 ? `\n...và ${enrollErrors.length - 5} lỗi khác` : '');
            }
            alert(msg);

            // Reset
            state.importEnrollStudents = [];
            if (previewSection) previewSection.style.display = 'none';
            if (fileInput) fileInput.value = '';
            if (fileName) fileName.textContent = 'Chưa chọn file';
            if (typeof window.renderAll === 'function') await window.renderAll();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            state.importEnrollStudents = [];
            if (previewSection) previewSection.style.display = 'none';
            if (fileInput) fileInput.value = '';
            if (fileName) fileName.textContent = 'Chưa chọn file';
        });
    }

    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', generateTemplate);
    }

    // Initial render of course dropdown
    renderImportEnrollCourseDropdown();
};

// ===== Import Students & Courses (each row has student + course info) =====

const COURSE_STUDENT_HEADER_MAP = {
    'stt': 'stt',
    'so': 'stt',
    'sothutu': 'stt',
    'hoten': 'hoTen',
    'ho': 'hoTen',
    'ten': 'hoTen',
    'hovaten': 'hoTen',
    'ngaysinh': 'ngaySinh',
    'sinh': 'ngaySinh',
    'gioitinh': 'gioiTinh',
    'gioi': 'gioiTinh',
    'sodienthoai': 'soDienThoai',
    'sdt': 'soDienThoai',
    'dienthoai': 'soDienThoai',
    'email': 'email',
    'thudien': 'email',
    'diachi': 'diaChi',
    'dia': 'diaChi',
    'uudai': 'uuDai',
    'giamgia': 'uuDai',
    'tenkhoahoc': 'tenKhoaHoc',
    'khoahoc': 'tenKhoaHoc',
    'mon': 'tenKhoaHoc',
    'monhoc': 'tenKhoaHoc',
    'giangvien': 'giangVien',
    'giaovien': 'giangVien',
    'thang': 'thang',
    'hocphi': 'hocPhi',
    'phi': 'hocPhi',
    'sisotoida': 'siSoToiDa',
    'siso': 'siSoToiDa',
    'soluong': 'siSoToiDa',
    'ngayghidanh': 'ngayGhiDanh',
    'ngay': 'ngayGhiDanh',
    'ngaydangky': 'ngayGhiDanh',
};

const normalizeCourseStudentHeader = header => {
    if (!header) return '';
    return header.toString().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]/g, '');
};

const parseCourseStudentRow = (rawRow) => {
    const row = {};
    Object.keys(rawRow).forEach(rawKey => {
        const normalized = normalizeCourseStudentHeader(rawKey);
        const mappedKey = COURSE_STUDENT_HEADER_MAP[normalized];
        if (mappedKey) {
            row[mappedKey] = rawRow[rawKey];
        } else {
            row[rawKey] = rawRow[rawKey];
        }
    });
    return row;
};

const rowToCourseStudent = (row) => {
    const hoTen = (row.hoTen || row['Họ Tên'] || row['Ho Ten'] || row.hoten || '').toString().trim();
    const soDienThoai = (row.soDienThoai || row['Số Điện Thoại'] || row['So Dien Thoai'] || row.SDT || row.sdt || '').toString().trim();
    const email = (row.email || row.Email || '').toString().trim();
    const ngaySinh = parseDateValue(row.ngaySinh || row['Ngày Sinh'] || row['Ngay Sinh'] || '');
    const gioiTinh = (row.gioiTinh || row['Giới Tính'] || row['Gioi Tinh'] || '').toString().trim();
    const diaChi = (row.diaChi || row['Địa Chỉ'] || row['Dia Chi'] || '').toString().trim();

    const tenKhoaHoc = (row.tenKhoaHoc || row['Tên Khóa Học'] || row['Ten Khoa Hoc'] || row['Khóa Học'] || row['Khoa Hoc'] || row.monhoc || '').toString().trim();
    const giangVien = (row.giangVien || row['Giảng Viên'] || row['Giang Vien'] || row.giaovien || '').toString().trim();
    const thangVal = row.thang || row.Tháng || row.Thang || row.thang || '';
    const thang = thangVal ? parseInt(thangVal.toString().trim()) : null;
    const hocPhiVal = row.hocPhi || row['Học Phí'] || row['Hoc Phi'] || row.phi || row.Phi || 0;
    const hocPhi = parseFloat(hocPhiVal.toString().replace(/[.,]/g, '')) || 0;
    const siSoVal = row.siSoToiDa || row['Sĩ Số Tối Đa'] || row['Si So Toi Da'] || row['Sĩ Số'] || row['Si So'] || 30;
    const siSoToiDa = parseInt(siSoVal.toString().trim()) || 30;
    const ngayGhiDanh = parseDateValue(row.ngayGhiDanh || row['Ngày Ghi Danh'] || row['Ngay Ghi Danh'] || row['Ngày'] || row['Ngay'] || '');

    return {
        hoTen, soDienThoai, email, ngaySinh, gioiTinh, diaChi,
        tenKhoaHoc, giangVien, thang, hocPhi, siSoToiDa, ngayGhiDanh
    };
};

export const parseCourseStudentExcel = (file) => {
    return new Promise((resolve, reject) => {
        if (typeof XLSX === 'undefined') {
            reject(new Error('Thư viện SheetJS (XLSX) chưa được tải. Vui lòng tải lại trang.'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                if (rawRows.length === 0) {
                    reject(new Error('File không có dữ liệu hoặc định dạng không hợp lệ.'));
                    return;
                }
                const parsedRows = rawRows.map(row => parseCourseStudentRow(row));
                const records = parsedRows.map(row => rowToCourseStudent(row));
                const validRecords = records.filter(r => r.hoTen && r.tenKhoaHoc);
                const errors = [];
                records.forEach((r, idx) => {
                    if (!r.hoTen) errors.push(`Dòng ${idx + 2}: Thiếu "Họ Tên"`);
                    if (!r.tenKhoaHoc) errors.push(`Dòng ${idx + 2}: Thiếu "Tên Khóa Học"`);
                });
                resolve({ records: validRecords, errors, totalRows: rawRows.length });
            } catch (err) {
                reject(new Error('Lỗi đọc file: ' + err.message));
            }
        };
        reader.onerror = () => reject(new Error('Không thể đọc file.'));
        reader.readAsArrayBuffer(file);
    });
};

export const generateCourseStudentTemplate = () => {
    if (typeof XLSX === 'undefined') {
        alert('Thư viện SheetJS chưa được tải. Vui lòng tải lại trang.');
        return;
    }
    const templateData = [
        {
            'STT': 1,
            'Họ Tên': 'Nguyễn Văn A',
            'Số Điện Thoại': '0901234567',
            'Ngày Sinh': '01/01/2000',
            'Giới Tính': 'Nam',
            'Email': 'nguyenvana@email.com',
            'Địa Chỉ': 'Hà Nội',
            'Tên Khóa Học': 'Tiếng Anh Cơ Bản',
            'Giảng Viên': 'Thần Hoàn',
            'Tháng': 6,
            'Học Phí': 500000,
            'Sĩ Số Tối Đa': 30,
            'Ngày Ghi Danh': '01/06/2026'
        },
        {
            'STT': 2,
            'Họ Tên': 'Trần Thị B',
            'Số Điện Thoại': '0912345678',
            'Ngày Sinh': '15/05/2001',
            'Giới Tính': 'Nữ',
            'Email': 'tranthib@email.com',
            'Địa Chỉ': 'TP.HCM',
            'Tên Khóa Học': 'Tiếng Anh Nâng Cao',
            'Giảng Viên': 'Lâm Hoàn',
            'Tháng': 6,
            'Học Phí': 600000,
            'Sĩ Số Tối Đa': 25,
            'Ngày Ghi Danh': '01/06/2026'
        },
        {
            'STT': 3,
            'Họ Tên': 'Phạm Văn C',
            'Số Điện Thoại': '0923456789',
            'Ngày Sinh': '',
            'Giới Tính': '',
            'Email': '',
            'Địa Chỉ': '',
            'Tên Khóa Học': 'Tiếng Anh Cơ Bản',
            'Giảng Viên': 'Thần Hoàn',
            'Tháng': 7,
            'Học Phí': 500000,
            'Sĩ Số Tối Đa': 30,
            'Ngày Ghi Danh': '01/07/2026'
        }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Hoc Vien & Khoa Hoc');
    ws['!cols'] = [
        { wch: 5 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
        { wch: 22 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 8 },
        { wch: 12 }, { wch: 14 }, { wch: 14 }
    ];
    XLSX.writeFile(wb, 'Mau_import_hoc_vien_va_khoa_hoc.xlsx');
};

export const initCourseStudentImport = () => {
    const uploadBtn = document.getElementById('uploadCourseStudentBtn');
    const fileInput = document.getElementById('courseStudentFileInput');
    const fileName = document.getElementById('courseStudentFileName');
    const previewSection = document.getElementById('courseStudentImportPreview');
    const previewCount = document.getElementById('courseStudentPreviewCount');
    const previewBody = document.getElementById('courseStudentPreviewBody');
    const importAllBtn = document.getElementById('importAllCourseStudentBtn');
    const cancelBtn = document.getElementById('cancelCourseStudentImportBtn');
    const downloadTemplateBtn = document.getElementById('downloadCourseStudentTemplateBtn');

    let parsedRecords = [];

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (fileName) fileName.textContent = file.name;
            try {
                const result = await parseCourseStudentExcel(file);
                parsedRecords = result.records;
                if (result.errors.length > 0) {
                    alert('Cảnh báo:\n' + result.errors.slice(0, 5).join('\n') + (result.errors.length > 5 ? `\n...và ${result.errors.length - 5} lỗi khác` : ''));
                }
                if (previewCount) previewCount.textContent = parsedRecords.length;
                renderCourseStudentPreview();
                if (previewSection) previewSection.style.display = 'block';
            } catch (err) {
                alert('Lỗi đọc file: ' + err.message);
                if (fileName) fileName.textContent = 'Chưa chọn file';
                fileInput.value = '';
            }
        });
    }

    const renderCourseStudentPreview = () => {
        if (!previewBody) return;
        previewBody.innerHTML = '';
        parsedRecords.forEach((rec, index) => {
            const tr = document.createElement('tr');
            tr.dataset.index = index;
            const statusBadge = rec.hoTen && rec.tenKhoaHoc
                ? '<span class="status-badge status-active">Hợp lệ</span>'
                : '<span class="status-badge status-inactive">Thiếu dữ liệu</span>';
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${escapeHtml(rec.hoTen || '-')}</td>
                <td>${escapeHtml(rec.soDienThoai || '-')}</td>
                <td>${escapeHtml(rec.tenKhoaHoc || '-')}</td>
                <td>${escapeHtml(rec.giangVien || '-')}</td>
                <td>${rec.thang || '-'}</td>
                <td>${rec.hocPhi ? rec.hocPhi.toLocaleString('vi-VN') + ' ₫' : '-'}</td>
                <td>${rec.siSoToiDa || '-'}</td>
                <td>${rec.ngayGhiDanh || '-'}</td>
                <td>${statusBadge}</td>
                <td><button class="btn btn-danger btn-sm" data-action="remove-cs" data-index="${index}">Xóa</button></td>
            `;
            previewBody.appendChild(tr);
        });
        previewBody.querySelectorAll('button[data-action="remove-cs"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                parsedRecords.splice(idx, 1);
                btn.closest('tr').remove();
                if (previewCount) previewCount.textContent = parsedRecords.length;
            });
        });
    };

    if (importAllBtn) {
        importAllBtn.addEventListener('click', async () => {
            if (!parsedRecords || parsedRecords.length === 0) {
                alert('Không có dữ liệu để import.');
                return;
            }

            let coursesCreated = 0;
            let studentsCreated = 0;
            let enrolledCount = 0;
            let skippedDuplicate = 0;
            const errors = [];

            for (const rec of parsedRecords) {
                if (!rec.hoTen || !rec.tenKhoaHoc) continue;

                // 1. Find or create course (match by name + month)
                let courseId = null;
                const existingCourse = state.courses.find(c =>
                    c.name.toLowerCase().trim() === rec.tenKhoaHoc.toLowerCase().trim() &&
                    c.month === rec.thang
                );

                if (existingCourse) {
                    courseId = existingCourse.id;
                } else {
                    if (!rec.giangVien) {
                        errors.push(`Khóa "${rec.tenKhoaHoc}" tháng ${rec.thang}: Thiếu giảng viên, bỏ qua.`);
                        continue;
                    }
                    if (!rec.thang || rec.thang < 1 || rec.thang > 12) {
                        errors.push(`Khóa "${rec.tenKhoaHoc}": Tháng không hợp lệ (${rec.thang}), bỏ qua.`);
                        continue;
                    }
                    courseId = generateId('co_');
                    const newCourse = {
                        id: courseId,
                        name: rec.tenKhoaHoc,
                        instructor: rec.giangVien,
                        month: rec.thang,
                        fee: rec.hocPhi || 0,
                        maxStudents: rec.siSoToiDa || 30,
                        status: 'Đang mở',
                        createdAt: new Date().toISOString()
                    };
                    state.courses.push(newCourse);
                    coursesCreated++;

                    if (storage.useServer) {
                        try {
                            await api.post('courses', newCourse);
                        } catch (err) {
                            errors.push(`Lỗi tạo khóa "${rec.tenKhoaHoc}": ${err.message}`);
                        }
                    }
                }

                // 2. Find or create student (match by phone)
                let studentId = null;
                const phone = rec.soDienThoai || '';
                const existingStudent = phone ? state.students.find(s => s.phone === phone) : null;
                if (existingStudent) {
                    studentId = existingStudent.id;
                }

                if (!studentId) {
                    studentId = generateId('st_');
                    const newStudent = {
                        id: studentId,
                        name: rec.hoTen,
                        phone: phone,
                        email: rec.email || '',
                        dob: rec.ngaySinh || '',
                        gender: rec.gioiTinh || '',
                        address: rec.diaChi || '',
                        status: 'Đang học',
                        discountType: '',
                        discountValue: 0,
                        createdAt: new Date().toISOString()
                    };
                    state.students.push(newStudent);
                    studentsCreated++;

                    if (storage.useServer) {
                        try {
                            await api.post('students', newStudent);
                        } catch (err) {
                            errors.push(`Lỗi tạo học viên "${rec.hoTen}": ${err.message}`);
                        }
                    }
                }

                // 3. Check duplicate enrollment
                const alreadyEnrolled = state.enrollments.some(e => e.studentId === studentId && e.courseId === courseId);
                if (alreadyEnrolled) {
                    skippedDuplicate++;
                    continue;
                }

                // 4. Check course capacity
                const currentEnrolled = state.enrollments.filter(e => e.courseId === courseId).length + enrolledCount;
                const course = state.courses.find(c => c.id === courseId);
                if (course && course.maxStudents && currentEnrolled >= course.maxStudents) {
                    errors.push(`Khóa "${course.name}" tháng ${course.month} đã đầy, bỏ qua học viên "${rec.hoTen}".`);
                    continue;
                }

                // 5. Enroll
                const enrollDate = rec.ngayGhiDanh || new Date().toISOString().split('T')[0];
                const enrollmentId = generateId('en_');
                state.enrollments.push({
                    id: enrollmentId,
                    studentId,
                    courseId,
                    date: enrollDate,
                    discountType: '',
                    discountValue: 0,
                    createdAt: new Date().toISOString()
                });
                enrolledCount++;

                if (storage.useServer) {
                    try {
                        await api.post('enrollments', {
                            id: enrollmentId,
                            studentId,
                            courseId,
                            date: enrollDate,
                            discountType: '',
                            discountValue: 0,
                            createdAt: new Date().toISOString()
                        });
                    } catch (err) {
                        errors.push(`Lỗi ghi danh "${rec.hoTen}" vào "${rec.tenKhoaHoc}": ${err.message}`);
                    }
                }
            }

            // Batch save for offline mode
            if (!storage.useServer) {
                if (coursesCreated > 0) await storage.saveCourses();
                if (studentsCreated > 0) await storage.saveStudents();
                if (enrolledCount > 0) await storage.saveEnrollments();
            }

            let msg = `Hoàn tất!\n- Khóa học mới tạo: ${coursesCreated}\n- Học viên mới tạo: ${studentsCreated}\n- Ghi danh thành công: ${enrolledCount}`;
            if (skippedDuplicate > 0) msg += `\n- Bỏ qua (đã ghi danh): ${skippedDuplicate}`;
            if (errors.length > 0) {
                msg += `\n\nCảnh báo:\n` + errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n...và ${errors.length - 5} cảnh báo khác` : '');
            }
            alert(msg);

            // Reset
            parsedRecords = [];
            if (previewSection) previewSection.style.display = 'none';
            if (fileInput) fileInput.value = '';
            if (fileName) fileName.textContent = 'Chưa chọn file';
            if (typeof window.renderAll === 'function') await window.renderAll();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            parsedRecords = [];
            if (previewSection) previewSection.style.display = 'none';
            if (fileInput) fileInput.value = '';
            if (fileName) fileName.textContent = 'Chưa chọn file';
        });
    }

    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', generateCourseStudentTemplate);
    }
};

// ===== Import Courses from Excel =====

const COURSE_REQUIRED_FIELDS = ['Tên Khóa Học', 'Giảng Viên'];

const normalizeCourseHeader = header => {
    if (!header) return '';
    return header.toString().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]/g, '');
};

const COURSE_HEADER_MAP = {
    'stt': 'stt',
    'tenkhoahoc': 'tenKhoaHoc',
    'khoahoc': 'tenKhoaHoc',
    'mon': 'tenKhoaHoc',
    'monhoc': 'tenKhoaHoc',
    'tensach': 'tenKhoaHoc',
    'giangvien': 'giangVien',
    'giaovien': 'giangVien',
    'thang': 'thang',
    'hocphi': 'hocPhi',
    'phi': 'hocPhi',
    'sisotoida': 'siSoToiDa',
    'siso': 'siSoToiDa',
    'soluong': 'siSoToiDa',
    'toida': 'siSoToiDa',
    'trangthai': 'trangThai',
    'tinhtrang': 'trangThai',
    'trangthai': 'trangThai',
    'ngaybatdau': 'ngayBatDau',
    'batdau': 'ngayBatDau',
};

const parseCourseRow = (rawRow) => {
    const row = {};
    Object.keys(rawRow).forEach(rawKey => {
        const normalized = normalizeCourseHeader(rawKey);
        const mappedKey = COURSE_HEADER_MAP[normalized];
        if (mappedKey) {
            row[mappedKey] = rawRow[rawKey];
        } else {
            row[rawKey] = rawRow[rawKey];
        }
    });
    return row;
};

const rowToCourse = (row) => {
    const tenKhoaHoc = (row.tenKhoaHoc || row['Tên Khóa Học'] || row.name || '').toString().trim();
    const giangVien = (row.giangVien || row['Giảng Viên'] || row.instructor || '').toString().trim();
    const thangVal = row.thang || row.Tháng || row.Thang || row.month || '';
    const thang = thangVal ? parseInt(thangVal.toString().trim()) : null;
    const hocPhiVal = row.hocPhi || row['Học Phí'] || row['Hoc Phi'] || row.fee || row.Phi || row.phi || 0;
    const hocPhi = parseFloat(hocPhiVal.toString().replace(/[.,]/g, '')) || 0;
    const siSoVal = row.siSoToiDa || row['Sĩ Số Tối Đa'] || row['Si So Toi Da'] || row['Sĩ Số'] || row['Si So'] || row.maxStudents || 30;
    const siSoToiDa = parseInt(siSoVal.toString().trim()) || 30;
    const trangThai = (row.trangThai || row['Trạng Thái'] || row.status || 'Chưa bắt đầu').toString().trim();
    const ngayBatDau = parseDateValue(row.ngayBatDau || row['Ngày Bắt Đầu'] || row['Ngay Bat Dau'] || '');

    return { tenKhoaHoc, giangVien, thang, hocPhi, siSoToiDa, trangThai, ngayBatDau };
};

export const generateCourseTemplate = () => {
    if (typeof XLSX === 'undefined') {
        alert('Thư viện SheetJS chưa được tải. Vui lòng tải lại trang.');
        return;
    }
    const templateData = [
        {
            'STT': 1,
            'Tên Khóa Học': 'Tiếng Anh Cơ Bản',
            'Giảng Viên': 'Nguyễn Văn A',
            'Tháng': 6,
            'Học Phí': 500000,
            'Sĩ Số Tối Đa': 30,
            'Trạng Thái': 'Đang mở'
        },
        {
            'STT': 2,
            'Tên Khóa Học': 'Tiếng Anh Nâng Cao',
            'Giảng Viên': 'Trần Thị B',
            'Tháng': 6,
            'Học Phí': 600000,
            'Sĩ Số Tối Đa': 25,
            'Trạng Thái': 'Đang mở'
        }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sach khoa hoc');
    ws['!cols'] = [
        { wch: 5 }, { wch: 20 }, { wch: 16 }, { wch: 8 },
        { wch: 12 }, { wch: 14 }, { wch: 14 }
    ];
    XLSX.writeFile(wb, 'Mau_danh_sach_khoa_hoc.xlsx');
};

export const initCourseImport = () => {
    const uploadBtn = document.getElementById('uploadCourseBtn');
    const fileInput = document.getElementById('courseFileInput');
    const fileName = document.getElementById('courseFileName');
    const previewSection = document.getElementById('courseImportPreview');
    const previewCount = document.getElementById('coursePreviewCount');
    const previewBody = document.getElementById('coursePreviewTableBody');
    const importAllBtn = document.getElementById('importAllCoursesBtn');
    const cancelBtn = document.getElementById('cancelCourseImportBtn');
    const downloadTemplateBtn = document.getElementById('downloadCourseTemplateBtn');

    let parsedCourses = [];

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (fileName) fileName.textContent = file.name;

            try {
                const data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            const arr = new Uint8Array(ev.target.result);
                            const wb = XLSX.read(arr, { type: 'array', cellDates: true });
                            const ws = wb.Sheets[wb.SheetNames[0]];
                            const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
                            resolve(rows);
                        } catch (err) { reject(err); }
                    };
                    reader.onerror = () => reject(new Error('Không thể đọc file.'));
                    reader.readAsArrayBuffer(file);
                });

                if (!Array.isArray(data) || data.length === 0) {
                    alert('File không có dữ liệu.');
                    return;
                }

                const parsed = data.map(r => parseCourseRow(r)).map(r => rowToCourse(r));
                parsedCourses = parsed.filter(c => c.tenKhoaHoc);

                if (parsedCourses.length === 0) {
                    alert('Không tìm thấy dữ liệu khóa học hợp lệ. Vui lòng kiểm tra lại file.');
                    return;
                }

                // Show errors
                const errs = [];
                parsed.forEach((c, i) => {
                    if (!c.tenKhoaHoc) errs.push(`Dòng ${i + 2}: Thiếu "Tên Khóa Học"`);
                });
                if (errs.length > 0) {
                    alert('Cảnh báo:\n' + errs.slice(0, 5).join('\n') + (errs.length > 5 ? `\n...và ${errs.length - 5} lỗi khác` : ''));
                }

                // Render preview
                if (previewBody) {
                    previewBody.innerHTML = '';
                    parsedCourses.forEach((c, i) => {
                        const tr = document.createElement('tr');
                        tr.dataset.index = i;
                        tr.innerHTML = `
                            <td>${i + 1}</td>
                            <td>${escapeHtml(c.tenKhoaHoc)}</td>
                            <td>${escapeHtml(c.giangVien || '-')}</td>
                            <td>${c.thang || '-'}</td>
                            <td>${c.hocPhi ? c.hocPhi.toLocaleString('vi-VN') + ' ₫' : '-'}</td>
                            <td>${c.siSoToiDa || '-'}</td>
                            <td>${escapeHtml(c.trangThai || '-')}</td>
                            <td><button class="btn btn-danger btn-sm" data-action="remove-course" data-index="${i}">Xóa</button></td>
                        `;
                        previewBody.appendChild(tr);
                    });
                    previewBody.querySelectorAll('button[data-action="remove-course"]').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const idx = parseInt(btn.dataset.index);
                            parsedCourses.splice(idx, 1);
                            btn.closest('tr').remove();
                            if (previewCount) previewCount.textContent = parsedCourses.length;
                        });
                    });
                }

                if (previewCount) previewCount.textContent = parsedCourses.length;
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
            if (!parsedCourses || parsedCourses.length === 0) {
                alert('Không có dữ liệu để import.');
                return;
            }

            let created = 0;
            let skipped = 0;
            const errs = [];

            for (const c of parsedCourses) {
                if (!c.tenKhoaHoc) continue;

                // Validate
                if (!c.giangVien) {
                    errs.push(`Khóa "${c.tenKhoaHoc}": Thiếu giảng viên, bỏ qua.`);
                    continue;
                }

                // Check duplicate by name + month
                const existing = state.courses.find(
                    cr => cr.name.toLowerCase().trim() === c.tenKhoaHoc.toLowerCase().trim()
                         && cr.month === c.thang
                );
                if (existing) {
                    skipped++;
                    continue;
                }

                const courseId = generateId('co_');
                const newCourse = {
                    id: courseId,
                    name: c.tenKhoaHoc,
                    instructor: c.giangVien,
                    month: c.thang,
                    fee: c.hocPhi || 0,
                    maxStudents: c.siSoToiDa || 30,
                    status: c.trangThai || 'Chưa bắt đầu',
                    createdAt: new Date().toISOString()
                };
                state.courses.push(newCourse);
                created++;

                if (storage.useServer) {
                    try {
                        await api.post('courses', newCourse);
                    } catch (err) {
                        errs.push(`Lỗi tạo khóa "${c.tenKhoaHoc}": ${err.message}`);
                    }
                }
            }

            if (!storage.useServer && created > 0) {
                await storage.saveCourses();
            }

            let msg = `Hoàn tất!\n- Khóa học mới tạo: ${created}`;
            if (skipped > 0) msg += `\n- Bỏ qua (đã tồn tại): ${skipped}`;
            if (errs.length > 0) {
                msg += `\n\nCảnh báo:\n` + errs.slice(0, 5).join('\n') + (errs.length > 5 ? `\n...và ${errs.length - 5} lỗi khác` : '');
            }
            alert(msg);

            parsedCourses = [];
            if (previewSection) previewSection.style.display = 'none';
            if (fileInput) fileInput.value = '';
            if (fileName) fileName.textContent = 'Chưa chọn file';
            if (typeof window.renderAll === 'function') await window.renderAll();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            parsedCourses = [];
            if (previewSection) previewSection.style.display = 'none';
            if (fileInput) fileInput.value = '';
            if (fileName) fileName.textContent = 'Chưa chọn file';
        });
    }

    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', generateCourseTemplate);
    }
};
