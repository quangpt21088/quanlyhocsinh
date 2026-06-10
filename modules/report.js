// modules/report.js - Report functions
import { state } from './state.js';
import { formatCurrency, formatCourseName, escapeHtml, getCourseAttendanceDates } from './utils.js';

export const renderReportDropdowns = async () => {
    const reportYear = document.getElementById('reportYear');
    const currentYear = reportYear?.value;
    const years = new Set();
    
    state.courses.forEach(c => {
        if (c.createdAt) years.add(new Date(c.createdAt).getFullYear());
        if (c.month) years.add(new Date().getFullYear());
    });
    state.attendances.forEach(a => {
        if (a.date) years.add(new Date(a.date).getFullYear());
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    
    if (reportYear) {
        reportYear.innerHTML = '<option value="">-- Chọn năm --</option>';
        sortedYears.forEach(y => {
            reportYear.innerHTML += `<option value="${y}">${y}</option>`;
        });
        if (currentYear) reportYear.value = currentYear;
    }

    const reportCourseOptions = document.getElementById('reportCourseOptions');
    const reportMonths = getReportMonths();
    const filteredReportCourses = reportMonths.length > 0
        ? state.courses.filter(c => reportMonths.includes(parseInt(c.month)))
        : state.courses;

    if (reportCourseOptions) {
        reportCourseOptions.innerHTML = '';
        filteredReportCourses.forEach(c => {
            const checked = getSelectedReportCourses().includes(c.id) ? 'checked' : '';
            reportCourseOptions.innerHTML += `
                <label class="multi-select-option">
                    <input type="checkbox" value="${escapeHtml(c.id)}" ${checked}> ${escapeHtml(formatCourseName(c))}
                </label>`;
        });
    }
    updateReportCourseText();
    attachCourseCheckboxListeners();
};

export const getSelectedReportCourses = () => {
    const checkboxes = document.querySelectorAll('#reportCourseOptions input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value).filter(v => v !== '');
};

export const updateReportCourseText = () => {
    const selected = getSelectedReportCourses();
    const reportCourseText = document.getElementById('reportCourseText');
    
    if (!reportCourseText) return;
    
    if (selected.length === 0) {
        reportCourseText.textContent = '-- Chọn khóa học --';
    } else if (selected.length === 1) {
        const course = state.courses.find(c => c.id === selected[0]);
        reportCourseText.textContent = course ? formatCourseName(course) : '1 khóa học';
    } else {
        reportCourseText.textContent = `${selected.length} khóa học đã chọn`;
    }
};

export const attachCourseCheckboxListeners = () => {
    const dropdown = document.getElementById('reportCourseDropdown');
    if (!dropdown || dropdown.dataset.listenersAttached) return;
    dropdown.dataset.listenersAttached = 'true';

    dropdown.addEventListener('change', e => {
        if (!e.target.matches('input[type="checkbox"]')) return;
        const allCheckbox = dropdown.querySelector('input[value=""]');
        const courseCheckboxes = dropdown.querySelectorAll('#reportCourseOptions input[type="checkbox"]');

        if (e.target === allCheckbox && allCheckbox.checked) {
            courseCheckboxes.forEach(cb => cb.checked = false);
        } else if (e.target !== allCheckbox && e.target.checked && allCheckbox) {
            allCheckbox.checked = false;
        }

        const anyChecked = Array.from(courseCheckboxes).some(c => c.checked);
        if (!anyChecked && allCheckbox) {
            allCheckbox.checked = true;
        }

        updateReportCourseText();
        renderReport();
    });
};

export const handleReportPeriodChange = () => {
    const reportPeriod = document.getElementById('reportPeriod');
    const period = reportPeriod?.value;
    const quarterWrap = document.getElementById('reportQuarterWrap');
    const monthWrap = document.getElementById('reportMonthWrap');
    const rangeWrap = document.getElementById('reportRangeWrap');
    const rangeDateMode = document.getElementById('rangeDateMode');
    const rangeMonthDisplay = document.getElementById('rangeMonthDisplay');
    const rangeDropdownMode = document.getElementById('rangeDropdownMode');

    const reportQuarter = document.getElementById('reportQuarter');
    const reportMonth = document.getElementById('reportMonth');
    const reportFromMonth = document.getElementById('reportFromMonth');
    const reportToMonth = document.getElementById('reportToMonth');

    if (period === 'month') {
        if (reportQuarter) reportQuarter.value = '';
        if (reportFromMonth) reportFromMonth.value = '';
        if (reportToMonth) reportToMonth.value = '';
        if (rangeDateMode) rangeDateMode.style.display = 'flex';
        if (rangeMonthDisplay) rangeMonthDisplay.style.display = 'none';
        if (rangeDropdownMode) rangeDropdownMode.style.display = 'none';
    } else if (period === 'quarter') {
        if (reportMonth) reportMonth.value = '';
        if (reportFromMonth) reportFromMonth.value = '';
        if (reportToMonth) reportToMonth.value = '';
        if (rangeDateMode) rangeDateMode.style.display = 'none';
        if (rangeMonthDisplay) rangeMonthDisplay.style.display = 'flex';
        if (rangeDropdownMode) rangeDropdownMode.style.display = 'none';
    } else if (period === 'range') {
        if (reportQuarter) reportQuarter.value = '';
        if (reportMonth) reportMonth.value = '';
        const reportFromDate = document.getElementById('reportFromDate');
        const reportToDate = document.getElementById('reportToDate');
        if (reportFromDate) reportFromDate.value = '';
        if (reportToDate) reportToDate.value = '';
        if (rangeDateMode) rangeDateMode.style.display = 'none';
        if (rangeMonthDisplay) rangeMonthDisplay.style.display = 'none';
        if (rangeDropdownMode) rangeDropdownMode.style.display = 'flex';
    } else if (period === 'year') {
        if (reportQuarter) reportQuarter.value = '';
        if (reportMonth) reportMonth.value = '';
        if (reportFromMonth) reportFromMonth.value = '';
        if (reportToMonth) reportToMonth.value = '';
        if (rangeDateMode) rangeDateMode.style.display = 'flex';
        if (rangeMonthDisplay) rangeMonthDisplay.style.display = 'none';
        if (rangeDropdownMode) rangeDropdownMode.style.display = 'none';
    }

    renderReport();
};

export const getReportMonths = () => {
    const reportPeriod = document.getElementById('reportPeriod');
    const reportYear = document.getElementById('reportYear');
    const reportQuarter = document.getElementById('reportQuarter');
    const reportMonth = document.getElementById('reportMonth');
    const reportFromMonth = document.getElementById('reportFromMonth');
    const reportToMonth = document.getElementById('reportToMonth');

    const period = reportPeriod?.value;
    const year = parseInt(reportYear?.value);

    if (!year) return [];

    if (period === 'year') {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }

    if (period === 'quarter') {
        const quarter = parseInt(reportQuarter?.value);
        if (!quarter) return [];
        return [(quarter - 1) * 3 + 1, (quarter - 1) * 3 + 2, (quarter - 1) * 3 + 3];
    }

    if (period === 'month') {
        const month = parseInt(reportMonth?.value);
        if (!month) return [];
        return [month];
    }

    if (period === 'range') {
        const from = parseInt(reportFromMonth?.value);
        const to = parseInt(reportToMonth?.value);
        if (!from || !to || from > to) return [];
        const months = [];
        for (let m = from; m <= to; m++) months.push(m);
        return months;
    }

    return [];
};

export const calculateCourseRevenue = (courseId, months, year) => {
    const courseEnrollments = state.enrollments.filter(e => e.courseId === courseId);
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return { students: 0, sessions: 0, revenue: 0, discount: 0, net: 0, details: [] };

    const dates = getCourseAttendanceDates(courseId).filter(d => {
        const date = new Date(d);
        return months.includes(date.getMonth() + 1) && date.getFullYear() === year;
    });
    const sessions = dates.length;

    let totalRevenue = 0;
    let totalDiscount = 0;
    let studentCount = 0;
    const details = [];

    courseEnrollments.forEach(enrollment => {
        const student = state.students.find(s => s.id === enrollment.studentId);
        if (!student) return;

        const presentCount = state.attendances.filter(
            a => a.studentId === student.id && a.courseId === courseId && a.present &&
                 months.includes(new Date(a.date).getMonth() + 1) && new Date(a.date).getFullYear() === year
        ).length;

        if (presentCount === 0 && sessions === 0) return;

        const gross = presentCount * course.fee;
        let discount = 0;
        if (enrollment.discountType === 'percent') {
            discount = gross * (enrollment.discountValue || 0) / 100;
        } else if (enrollment.discountType === 'amount') {
            discount = enrollment.discountValue || 0;
        }
        const net = Math.max(0, gross - discount);

        totalRevenue += gross;
        totalDiscount += discount;
        if (presentCount > 0) studentCount++;

        details.push({
            studentId: student.id,
            studentName: student.name,
            presentCount,
            gross,
            discount,
            net
        });
    });

    return {
        students: studentCount,
        sessions,
        revenue: totalRevenue,
        discount: totalDiscount,
        net: totalRevenue - totalDiscount,
        details
    };
};

export const renderReport = () => {
    const reportYear = document.getElementById('reportYear');
    const reportSummary = document.getElementById('reportSummary');
    const reportCourseSection = document.getElementById('reportCourseSection');
    const reportStudentSection = document.getElementById('reportStudentSection');
    const reportEmpty = document.getElementById('reportEmpty');

    const year = parseInt(reportYear?.value);
    const months = getReportMonths();
    const selectedCourseIds = getSelectedReportCourses();

    if (!year || months.length === 0) {
        if (reportSummary) reportSummary.style.display = 'none';
        if (reportCourseSection) reportCourseSection.style.display = 'none';
        if (reportStudentSection) reportStudentSection.style.display = 'none';
        if (reportEmpty) reportEmpty.style.display = 'block';
        return;
    }

    if (reportEmpty) reportEmpty.style.display = 'none';
    if (reportSummary) reportSummary.style.display = 'grid';

    const coursesToReport = selectedCourseIds.length > 0
        ? state.courses.filter(c => selectedCourseIds.includes(c.id))
        : state.courses.filter(c => {
            const dates = getCourseAttendanceDates(c.id).filter(d => {
                const date = new Date(d);
                return months.includes(date.getMonth() + 1) && date.getFullYear() === year;
            });
            return dates.length > 0;
        });

    let grandRevenue = 0;
    let grandDiscount = 0;
    let grandStudents = new Set();
    let grandSessions = 0;
    const courseResults = [];

    coursesToReport.forEach(course => {
        const result = calculateCourseRevenue(course.id, months, year);
        grandRevenue += result.revenue;
        grandDiscount += result.discount;
        grandSessions += result.sessions;
        result.details.forEach(d => {
            if (d.presentCount > 0) grandStudents.add(d.studentId);
        });
        courseResults.push({ course, ...result });
    });

    const totalRevenue = document.getElementById('reportTotalRevenue');
    const totalStudents = document.getElementById('reportTotalStudents');
    const totalSessions = document.getElementById('reportTotalSessions');
    const totalDiscountEl = document.getElementById('reportTotalDiscount');

    if (totalRevenue) totalRevenue.textContent = formatCurrency(grandRevenue - grandDiscount);
    if (totalStudents) totalStudents.textContent = grandStudents.size;
    if (totalSessions) totalSessions.textContent = grandSessions;
    if (totalDiscountEl) totalDiscountEl.textContent = formatCurrency(grandDiscount);

    // Render course table
    const reportCourseBody = document.getElementById('reportCourseBody');
    if (reportCourseBody) {
        if (courseResults.length > 0) {
            if (reportCourseSection) reportCourseSection.style.display = 'block';
            reportCourseBody.innerHTML = '';
            
            courseResults.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${escapeHtml(formatCourseName(r.course))}</strong></td>
                    <td>${r.students}</td>
                    <td>${r.sessions}</td>
                    <td>${formatCurrency(r.course.fee)}</td>
                    <td>${formatCurrency(r.revenue)}</td>
                    <td>${formatCurrency(r.discount)}</td>
                    <td><strong>${formatCurrency(r.net)}</strong></td>
                `;
                reportCourseBody.appendChild(tr);
            });
        } else {
            if (reportCourseSection) reportCourseSection.style.display = 'none';
        }
    }
};

export const handleYearChange = () => {
    const period = document.getElementById('reportPeriod')?.value;
    const year = parseInt(document.getElementById('reportYear')?.value);
    if (!year) return;

    if (period === 'year') {
        const reportFromDate = document.getElementById('reportFromDate');
        const reportToDate = document.getElementById('reportToDate');
        if (reportFromDate) reportFromDate.value = `${year}-01-01`;
        if (reportToDate) reportToDate.value = `${year}-12-31`;
    } else if (period === 'month') {
        handleMonthChange();
        return;
    } else if (period === 'quarter') {
        handleQuarterChange();
        return;
    } else if (period === 'range') {
        renderReportDropdowns();
        renderReport();
        return;
    }

    renderReportDropdowns();
    renderReport();
};

export const handleMonthChange = () => {
    const year = parseInt(document.getElementById('reportYear')?.value);
    const month = parseInt(document.getElementById('reportMonth')?.value);
    if (year && month) {
        const lastDay = new Date(year, month, 0).getDate();
        const reportFromDate = document.getElementById('reportFromDate');
        const reportToDate = document.getElementById('reportToDate');
        if (reportFromDate) reportFromDate.value = `${year}-${String(month).padStart(2, '0')}-01`;
        if (reportToDate) reportToDate.value = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }
    renderReportDropdowns();
    renderReport();
};

export const handleQuarterChange = () => {
    const year = parseInt(document.getElementById('reportYear')?.value);
    const quarter = parseInt(document.getElementById('reportQuarter')?.value);
    if (quarter) {
        const fromMonth = (quarter - 1) * 3 + 1;
        const toMonth = quarter * 3;
        const reportFromMonthLabel = document.getElementById('reportFromMonthLabel');
        const reportToMonthLabel = document.getElementById('reportToMonthLabel');
        if (reportFromMonthLabel) reportFromMonthLabel.textContent = `Tháng ${fromMonth}`;
        if (reportToMonthLabel) reportToMonthLabel.textContent = `Tháng ${toMonth}`;

        if (year) {
            const reportFromDate = document.getElementById('reportFromDate');
            const reportToDate = document.getElementById('reportToDate');
            if (reportFromDate) reportFromDate.value = `${year}-${String(fromMonth).padStart(2, '0')}-01`;
            const lastDay = new Date(year, toMonth, 0).getDate();
            if (reportToDate) reportToDate.value = `${year}-${String(toMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        }
    }
    renderReportDropdowns();
    renderReport();
};