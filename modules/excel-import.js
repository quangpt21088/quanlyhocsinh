// modules/excel-import.js - Excel/CSV Import Module (browser-compatible)
// Uses SheetJS (XLSX) loaded via CDN in index.html + FileReader API
import { state } from './state.js';
import { storage } from './storage.js';
import { escapeHtml } from './utils.js';

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
    students.forEach(student => {
        const phone = student.phone || '';
        if (phone && state.students.some(s => s.phone === phone)) {
            return;
        }
        state.students.push({
            ...student,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + importedCount
        });
        importedCount++;
    });

    if (importedCount > 0) {
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

            for (const studentData of state.importEnrollStudents) {
                // Check for duplicate by phone
                const phone = studentData.phone || '';
                let existingStudent = null;
                if (phone) {
                    existingStudent = state.students.find(s => s.phone === phone);
                }

                let studentId;
                if (existingStudent) {
                    studentId = existingStudent.id;
                } else {
                    studentId = Date.now().toString() + Math.random().toString(36).substr(2, 9) + importedCount;
                    state.students.push({
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
                    });
                    importedCount++;
                }

                // Check if already enrolled
                const alreadyEnrolled = state.enrollments.some(e => e.studentId === studentId && e.courseId === courseId);
                if (alreadyEnrolled) continue;

                // Check capacity
                const currentEnrolled = state.enrollments.filter(e => e.courseId === courseId).length;
                if (course.maxStudents && currentEnrolled >= course.maxStudents) {
                    alert(`Khóa học "${course.name}" đã đầy. Dừng ghi danh tại học viên "${studentData.name}".`);
                    break;
                }

                state.enrollments.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + enrolledCount,
                    studentId: studentId,
                    courseId: courseId,
                    date: enrollDate,
                    discountType: '',
                    discountValue: 0,
                    createdAt: new Date().toISOString()
                });
                enrolledCount++;
            }

            if (importedCount > 0) await storage.saveStudents();
            if (enrolledCount > 0) await storage.saveEnrollments();

            alert(`Hoàn tất!\n- Học viên mới được thêm: ${importedCount}\n- Ghi danh thành công: ${enrolledCount}`);

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
