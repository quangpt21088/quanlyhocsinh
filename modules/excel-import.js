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
            <td><button class="btn btn-danger btn-sm" onclick="this.closest('tr').remove(); window.excelImportRemoveRow(${index});">Xóa</button></td>
        `;
        tbody.appendChild(tr);
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
