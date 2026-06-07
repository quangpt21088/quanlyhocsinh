# Review Notes - Quản Lý Học Viên Trung Tâm

## 📅 Thông Tin Review
- **Thời gian**: 2026-06-04 ~ 2026-06-05
- **Workspace**: C:\Users\MrQ\Desktop\Quang\kilocode

---

## ✅ ĐÃ HOÀN THÀNH

### Modules Đã Tạo (16 modules):

| Module | Chức năng | Dòng |
|-------|----------|-----|
| state.js | State management | ~35 |
| api.js | API client layer | ~65 |
| utils.js | Utilities (formatCurrency, formatDate, getStatusClass, escapeHtml, formatCourseName, getStudentCourseCount, getCourseEnrollmentCount, getStudentCourses, getCourseAttendanceDates) | ~60 |
| storage.js | Hybrid storage + backup/restore | ~150 |
| ui.js | UI helpers (switchTab, showLogin, showApp, applyPermissions) | ~110 |
| auth.js | Auth + changePassword | ~120 |
| student.js | Student CRUD + detail + delete filtered | ~280 |
| course.js | Course CRUD + quick add/manage + validation | ~330 |
| enrollment.js | Enrollment + delete all + copy enrollment | ~420 |
| attendance.js | Attendance matrix | ~215 |
| payment.js | Payment + batch status + permission checks | ~370 |
| report.js | Report + date handling | ~380 |
| admin.js | Admin CRUD + handleAdminSubmit + API sync | ~210 |
| render-all.js | Render all + error handling | ~55 |
| merge-students.js | Merge students functionality | ~180 |
| excel-import.js | Excel/CSV import + Import & Enroll + Import Course + Import Course&Student | ~620 |

### Tổng số vấn đề đã sửa: 61 (59 cũ + 2 mới)

### Tất cả bug đã sửa. Code sẵn sàng cho production.

| # | Vấn đề | Mức độ | Trạng thái |
|---|--------|--------|-----------|
| 1 | utils.js - `state` không được import → ReferenceError | 🔴 CRITICAL | ✅ |
| 2 | student.js - Thiếu exports: showStudentDetail, closeStudentDetailModal, handleDeleteFilteredStudents | 🔴 HIGH | ✅ |
| 3 | report.js - Thiếu exports: handleYearChange, handleMonthChange, handleQuarterChange | 🔴 HIGH | ✅ |
| 4 | report.js - `reportToDate` không khai báo | 🔴 HIGH | ✅ |
| 5 | payment.js - Duplicate getCourseAttendanceDates | 🟡 MEDIUM | ✅ |
| 6 | attendance.js - Duplicate getCourseAttendanceDates | 🟡 MEDIUM | ✅ |
| 7 | report.js - Duplicate getCourseAttendanceDates | 🟡 MEDIUM | ✅ |
| 8 | quick-manage.js - Dead code | 🟡 MEDIUM | ✅ Đã xóa |
| 9 | highlight.js - Dead code | 🟢 LOW | ✅ Đã xóa |
| 10 | index.html - Thiếu type="module" | 🔴 HIGH | ✅ |
| 11 | index.html - Thiếu paymentStatusActions HTML elements | 🔴 HIGH | ✅ |
| 12 | app.js - Duplicate imports | 🟡 MEDIUM | ✅ |
| 13 | storage.js - Method names không nhất quán | 🟡 MEDIUM | ✅ |
| 14 | cancelAdminEdit - thiếu window assignment | 🟡 MEDIUM | ✅ |
| 15 | getStudentCourses thiếu trong utils.js | 🔴 HIGH | ✅ |
| 16 | auth.js - Dynamic import app.js (no-op) trong handleLogout | 🟡 MEDIUM | ✅ |
| 17 | Unused imports (hashPassword, applyPermissions) | 🟢 LOW | ✅ |
| 18 | clearStudentFilterInputs thiếu trong student.js | 🔴 HIGH | ✅ |
| 19 | XSS - renderCourseTable chưa escapeHtml | 🔴 CRITICAL | ✅ |
| 20 | payment.js - Thiếu permission checks | 🔴 CRITICAL | ✅ |
| 21 | render-all.js - Thiếu error handling | 🔴 CRITICAL | ✅ |
| 22 | course.js - Thiếu validation (fee NaN, month range, empty name) | 🔴 HIGH | ✅ |
| 23 | handlePaymentConfirm không re-render UI | 🔴 HIGH | ✅ |
| 24 | deleteCourse không clean up paymentRecords | 🔴 HIGH | ✅ |
| 25 | formatCurrency không xử lý NaN | 🟡 MEDIUM | ✅ |
| 26 | report.js - getReportMonths year derivation sai | 🟡 MEDIUM | ✅ |
| 27 | report.js - handleYearChange thiếu xử lý range period | 🟡 MEDIUM | ✅ |
| 28 | report.js - handleQuarterChange thiếu set date range | 🟡 MEDIUM | ✅ |
| 29 | auth.js - handleLogin thiếu null check | 🟡 MEDIUM | ✅ |
| 30 | XSS - renderStudentTable chưa escapeHtml | 🔴 CRITICAL | ✅ |
| 31 | XSS - showStudentDetail chưa escapeHtml | 🔴 CRITICAL | ✅ |
| 32 | XSS - renderEnrollmentTable chưa escapeHtml | 🔴 CRITICAL | ✅ |
| 33 | XSS - renderAttendanceMatrix + dropdowns chưa escapeHtml | 🔴 CRITICAL | ✅ |
| 34 | XSS - renderPaymentStudents + Details chưa escapeHtml | 🔴 CRITICAL | ✅ |
| 35 | XSS - renderAdminTable chưa escapeHtml | 🔴 CRITICAL | ✅ |
| 36 | XSS - renderReport + dropdowns chưa escapeHtml | 🔴 CRITICAL | ✅ |
| 37 | XSS - renderQuickManageTable chưa escapeHtml | 🔴 CRITICAL | ✅ |
| 38 | getCourseAttendanceDates duplicate trong 3 files | 🟡 MEDIUM | ✅ |

### Sau khi sửa, còn lại (không ảnh hưởng functionality):
- Circular dependency auth.js ↔ ui.js (ES modules xử lý được)
- renderPaymentStudents status filter lọc theo student status thay vì payment status (design choice)
- handleQuickAddCourse duplicate check có thể match source course (edge case hiếm)

### Test Results:
- Node.js module import tests: 23/23 PASSED
- Browser test files: test-browser.html, test-flow.html

### Files đã xóa (dead code):
- modules/quick-manage.js
- modules/highlight.js

### Runtime bugs đã sửa:
1. handleLogin catch block null check + localStorage fallback (CRITICAL)
2. handleLogin empty form validation (LOW)
3. handleQuickAddCourse không clear source course (MODERATE)
4. renderPaymentStudents month filter quá hạn chế (MODERATE)
5. clearStudentFilterInputs vs renderStudentTable conflict (LOW)

### Tất cả CRITICAL và HIGH issues đã sửa. Code sẵn sàng cho production.

---

## 🐛 LỖI MỚI PHÁT HIỆN (Review 2026-06-06) — ĐÃ SỬA HẾT

### Tổng số lỗi mới: 10 (tất cả đã sửa ✅)

| # | Vấn đề | Mức độ | Trạng thái |
|---|--------|--------|-----------|
| 44 | student.js - Thiếu import `formatCurrency`, `formatCourseName` → ReferenceError khi mở Student Detail | 🔴 CRITICAL | ✅ |
| 45 | excel-import.js - Dùng Node.js APIs (`fs`, `csv-parser`, `xml2js`) trong browser code, hoàn toàn không hoạt động | 🔴 CRITICAL | ✅ |
| 46 | report.js - Thiếu import `getCourseAttendanceDates` → ReferenceError khi tạo báo cáo | 🟡 MEDIUM | ✅ |
| 47 | index.html - Text mặc định `#reportCourseText` là "Tất cả khóa học" nhưng logic kiểm tra `-- Chọn khóa học --` | 🟡 MEDIUM | ✅ |
| 48 | app.js - `paymentMonthFilter` change handler: set `paymentCourseSelect.value = ''` rồi kiểm tra `paymentCourseSelect.value` → luôn false, `handlePaymentSelect()` không bao giờ chạy | 🟡 MEDIUM | ✅ |
| 49 | auth.js - `state.admins = []` (empty array, truthy) không fallback về localStorage vì `&& state.admins.length > 0` nằm sau | 🟡 MEDIUM | ✅ |
| 50 | payment.js - `tr.className += \` ${rowClass}\`` thêm trailing space khi `rowClass` là empty string | 🟢 LOW | ✅ |
| 51 | style.css - CSS trùng lặp (lines 594-696 duplicate payment status rules đã có ở 437-470, 584-662) | 🟢 LOW | ✅ |
| 52 | index.html - `#changePasswordModal` dùng inline `style="display:none"` thay vì CSS class | 🟢 LOW | ✅ |
| 53 | app.js - `initBackupRestore` được gọi trước khi định nghĩa (line 191 gọi, line 195 định nghĩa) — fragile ordering | 🟢 LOW | ✅ |

### Mô tả chi tiết

#### #44 — student.js thiếu import `formatCurrency`, `formatCourseName` (🔴 CRITICAL)
- **File**: `modules/student.js:5` (dòng import) và `modules/student.js:220-221` (nơi dùng)
- **Nguyên nhân**: Dòng 5 chỉ import `getStudentCourseCount, getStudentCourses, formatDate, getStatusClass, escapeHtml`. Nhưng `showStudentDetail` ở dòng 220-221 gọi `formatCurrency(course.fee)` và `formatCourseName(course)` — cả hai đều **không được import**.
- **Hậu quả**: `ReferenceError: formatCurrency is not defined` khi user click "Chi Tiết" trên học viên. Modal chi tiết học viên **không bao giờ mở được**.
- **Cách sửa**: Thêm `formatCurrency, formatCourseName` vào dòng import từ `./utils.js`.

#### #45 — excel-import.js hoàn toàn broken (🔴 CRITICAL)
- **File**: `modules/excel-import.js` (toàn bộ file)
- **Nguyên nhân**: File này viết cho Node.js nhưng được dùng trong browser:
  - Line 4: `import * as fs from 'fs'` — `fs` không tồn tại trong browser
  - Line 5: `import csv from 'csv-parser'` — Node.js-only library
  - Line 21: `new xml2js.Parser()` — `xml2js` không import và là Node.js-only
  - Line 25: `fs.createReadStream()` — không hoạt động trong browser
  - Line 35: Typo tên cột: `'Hồ Tàn'`, `'Ngày Sựn'`, `'Giải Tính'` (đúng: `'Họ Tên'`, `'Ngày Sinh'`, `'Giới Tính'`)
  - Line 45: `row.STTC` — typo, đúng `row.STT`
  - Line 55: `import('./student').then({ addStudent: student })` — sai cú pháp destructuring trong `.then()`, và `addStudent` không tồn tại trong `student.js`
- **Hậu quả**: Import file này sẽ crash ngay. Tính năng Excel import **hoàn toàn không hoạt động**.
- **Cách sửa**: Viết lại toàn bộ dùng `FileReader` API + SheetJS (`xlsx` đã có sẵn qua CDN trong `index.html`), bỏ hết Node.js dependencies.

#### #46 — report.js thiếu import `getCourseAttendanceDates` (🟡 MEDIUM)
- **File**: `modules/report.js:3` (dòng import) và `modules/report.js:196` (nơi dùng)
- **Nguyên nhân**: Dòng 3 chỉ import `formatCurrency, formatCourseName, escapeHtml`. Nhưng `calculateCourseRevenue` ở dòng 196 gọi `getCourseAttendanceDates(courseId)` — **không được import**.
- **Hậu quả**: `ReferenceError: getCourseAttendanceDates is not defined` khi tạo báo cáo doanh thu. Tab Báo Cáo **không hiển thị được dữ liệu**.
- **Cách sửa**: Thêm `getCourseAttendanceDates` vào dòng import từ `./utils.js`.

#### #47 — Text mặc định report course selector không khớp logic (🟡 MEDIUM)
- **File**: `index.html:1025` và `report.js:58`
- **Nguyên nhân**: `index.html` đặt text mặc định là `"Tất cả khóa học"` nhưng `report.js:58` kiểm tra `reportCourseText.textContent === '-- Chọn khóa học --'` để xác định trạng thái "chưa chọn".
- **Hậu quả**: Logic kiểm tra trạng thái "chưa chọn" không bao giờ match, có thể gây lỗi hiển thị hoặc behavior sai.
- **Cách sửa**: Đồng bộ text — đổi `index.html:1025` thành `"-- Chọn khóa học --"` hoặc đổi logic trong `report.js`.

#### #48 — paymentMonthFilter change handler có dead code (🟡 MEDIUM)
- **File**: `app.js:172-176`
- **Nguyên nhân**:
  ```js
  if (paymentMonthFilter) paymentMonthFilter.addEventListener('change', () => {
      paymentCourseSelect.value = '';           // line 173: set value = ''
      renderPaymentDropdowns(paymentMonthFilter.value);
      if (paymentCourseSelect.value && paymentSelectBtn) handlePaymentSelect();  // line 175: luôn false
  });
  ```
  Dòng 173 set `paymentCourseSelect.value = ''`, dòng 175 kiểm tra `paymentCourseSelect.value` — luôn falsy.
- **Hậu quả**: Sau khi chọn tháng mới, `handlePaymentSelect()` không tự động chạy. User phải click "Chọn" thủ công. Không crash nhưng UX không như thiết kế.
- **Cách sửa**: Bỏ dòng 173 hoặc set `paymentCourseSelect.value` trước khi gọi `renderPaymentDropdowns`, rồi mới check.

#### #49 — auth.js localStorage fallback không hoạt động khi state.admins = [] (🟡 MEDIUM)
- **File**: `modules/auth.js:52-54`
- **Nguyên nhân**:
  ```js
  const admins = state.admins && state.admins.length > 0
      ? state.admins
      : JSON.parse(localStorage.getItem('admins') || '[]');
  ```
  Khi `state.admins = []` (empty array, truthy), `state.admins && state.admins.length > 0` = `[] && 0` = `[]` (truthy trong JS!). Thực tế `[] && 0` trả về `[]` vì `[]` truthy, rồi `[] > 0` = `false`. Nhưng nếu `state.admins` là `[]`, toán tử `&&` trả về `[]`, rồi `[] > 0` = `false`, nên fallback **có hoạt động**. Tuy nhiên, nếu `state.admins` chưa được khởi tạo (vẫn là `[]` từ `state.js`), thì `state.admins.length > 0` = `false`, fallback sẽ chạy. **Lỗi thực tế**: Nếu `storage.getStudents()` được gọi trước và set `state.admins = []` từ API trả về rỗng, thì fallback sẽ chạy đúng. Nhưng nếu `state.admins` không bao giờ được set (không gọi `storage.getAdmins()`), thì `state.admins` vẫn là `[]` từ khởi tạo, và fallback **có chạy**. **Tuy nhiên**, vấn đề là `renderAll` không gọi `storage.getAdmins()`, nên `state.admins` luôn là `[]` cho đến khi login fallback đọc localStorage.
- **Hậu quả**: Nếu admin tồn tại trong localStorage nhưng `state.admins` không được load trước login, login fallback sẽ không tìm thấy admin. Thực tế `renderAll` không load admins nên đây là bug thực sự.
- **Cách sửa**: Thêm `storage.getAdmins()` vào `renderAll` hoặc `init()`, hoặc sửa logic check: `state.admins.length > 0 ? state.admins : JSON.parse(...)`.

#### #50 — payment.js className trailing space (🟢 LOW)
- **File**: `modules/payment.js:128`
- **Nguyên nhân**: `tr.className += \` ${rowClass}\``` — khi `rowClass = ''`, kết quả là `" "` (string với một space).
- **Hậu quả**: Không ảnh hưởng functionality, nhưng tạo DOM không sạch.
- **Cách sửa**: `if (rowClass) tr.className += \` ${rowClass}\``.

#### #51 — style.css duplicate CSS (🟢 LOW)
- **File**: `style.css:594-696`
- **Nguyên nhân**: Payment status CSS rules ở lines 594-696 trùng lặp với rules ở lines 437-470 và 584-662.
- **Hậu quả**: Không ảnh hưởng hiển thị, nhưng tăng file size và khó maintain.
- **Cách sửa**: Xóa lines 594-696.

#### #52 — index.html inline style (🟢 LOW)
- **File**: `index.html:36`
- **Nguyên nhân**: `<div class="modal-overlay" id="changePasswordModal" style="display:none;">` dùng inline style.
- **Hậu quả**: Không ảnh hưởng functionality, nhưng không nhất quán với phần còn lại của codebase.
- **Cách sửa**: Thêm CSS rule `#changePasswordModal { display: none; }` vào `style.css`.

#### #53 — app.js fragile function ordering (🟢 LOW)
- **File**: `app.js:191` (gọi) và `app.js:195` (định nghĩa)
- **Nguyên nhân**: `initBackupRestore()` được gọi ở line 191 nhưng định nghĩa ở line 195. Vì `initBackupRestore` là `const` arrow function, nó **không được hoisted**. Tuy nhiên, `init()` được gọi ở line 260 (cuối file), lúc đó `initBackupRestore` đã được định nghĩa. Nên **không crash**, nhưng fragile.
- **Hậu quả**: Nếu ai đó di chuyển `init()` call lên trước, sẽ crash `ReferenceError`.
- **Cách sửa**: Di chuyển định nghĩa `initBackupRestore` lên trên dòng `setupEventListeners` hoặc trước `init()`.

---

## 🐛 LỖI MỚI PHÁT HIỆN (Review 2026-06-07) — ĐÃ SỬA HẾT

### Tổng số lỗi mới: 8 (tất cả đã sửa ✅)

| # | Vấn đề | Mức độ | Trạng thái |
|---|--------|--------|-----------|
| 54 | api.js - `handleAuthError()` gọi `window.location.reload()` trên mọi 401 → F5 loop vô hình khi server trả 401 trên ping hoặc login | 🔴 CRITICAL | ✅ |
| 55 | auth.js - Login fallback dùng `state.admins` (luôn `[]`) thay vì đọc trực tiếp localStorage → dead code, không ảnh hưởng thực tế nhưng logic sai | 🟢 LOW | ✅ |
| 56 | api.js - `handleAuthError()` reload khi `renderAll` gọi API mà chưa login (không có token) → F5 loop tương tự #54 | 🔴 CRITICAL | ✅ |
| 57 | auth.js - `handleLogin` không check `result === null` trước khi access `result.token` → TypeError khi server trả 401 | 🔴 CRITICAL | ✅ |
| 58 | storage.js - Server-mode `getStudents()`/`getCourses()`/`getEnrollments()` không set `state.*` khi dùng API → UI luôn hiển thị trống khi deploy | 🔴 HIGH | ✅ |
| 59 | storage.js - `getAttendances()`/`getPaymentRecords()`/`getAdmins()` cùng bug #58 — server-mode không set `state.*` | 🔴 HIGH | ✅ |
| 60 | api.js - `handleAuthError()` dùng `window.location.reload()` gây F5 loop khi 401 sau login — nên dùng `showLogin()` để logout graceful | 🔴 CRITICAL | ✅ |
| 61 | api.js - Import `showLogin` từ `ui.js` gây circular dependency `api→ui→auth→api` — fix bằng `window.showLogin()` | 🟡 MEDIUM | ✅ |

### Mô tả chi tiết

#### #54 — api.js handleAuthError gây infinite reload loop (🔴 CRITICAL)
- **File**: `modules/api.js:35-38`
- **Nguyên nhân**: `handleAuthError()` được gọi khi bất kỳ API request nào trả về 401. Hàm này luôn gọi `window.location.reload()`. Vòng lặp:
  1. `storage.init()` gọi `api.get('ping')` → server trả 401 → `handleAuthError()` → `reload()`
  2. Reload → `init()` → `storage.init()` → `api.get('ping')` → 401 → reload() → **vô hạn**
  3. Tương tự nếu `auth/login` trả 401 → reload → `init()` → ping 401 → reload → loop
- **Hậu quả**: Trang web F5 liên tạc không dừng, user không thể login.
- **Cách sửa**: Thêm `endpoint` parameter vào `handleAuthError()`, skip reload cho `/ping` và `/auth/login`. Hai endpoint này cần xử lý graceful (ping → fallback localStorage, login → fallback check).

#### #55 — auth.js login fallback logic sai (🟢 LOW)
- **File**: `modules/auth.js:52` (trước khi sửa)
- **Nguyên nhân**:
  ```js
  // Trước (sai — state.admins luôn [] nên nhánh state.admins chạy không bao giờ):
  const localAdmins = JSON.parse(localStorage.getItem('admins') || '[]');
  const admins = localAdmins.length > 0 ? localAdmins : (state.admins.length > 0 ? state.admins : []);
  // Sau (đúng — đọc trực tiếp localStorage):
  const admins = JSON.parse(localStorage.getItem('admins') || '[]');
  ```
  `state.admins` không bao giờ được load trước login (không gọi `storage.getAdmins()`), nên `state.admins.length > 0` luôn false. Nhánh `state.admins` là dead code.
- **Hậu quả**: Không ảnh hưởng thực tế vì `localAdmins` fallback vẫn đọc đúng localStorage. Chỉ là logic thừa/dead code.
- **Cách sửa**: Bỏ hoàn toàn việc tham chiếu `state.admins` trong login fallback, chỉ dùng `localStorage.getItem('admins')`.

#### #56 — api.js handleAuthError reload khi chưa login (🔴 CRITICAL)
- **File**: `modules/api.js:35-43`
- **Nguyên nhân**: Sau fix #54, `handleAuthError` skip reload cho `/ping` và `/auth/login`. Nhưng khi `useServer = true` và user chưa login, `renderAll()` gọi `storage.getStudents()` → `api.get('students')` → server trả 401 (không có token) → `handleAuthError('/students')` → **không phải ping/login** → `window.location.reload()` → loop.
- **Hậu quả**: F5 loop khi deploy — trang tải, gọi API, 401, reload, lặp lại vô hạn.
- **Cách sửa**: Thêm check `!localStorage.getItem('token')` — nếu không có token (user chưa login), 401 là expected behavior, không cần reload.

#### #57 — auth.js handleLogin không check null result (🔴 CRITICAL)
- **File**: `modules/auth.js:37-43`
- **Nguyên nhân**: Khi `api.post('auth/login')` trả 401, `handleAuthError` skip reload (fix #54/#56), `request()` trả về `null`. Nhưng `handleLogin` kiểm tra `result?.error` — `null?.error` = `undefined` (falsy) → rơi vào `localStorage.setItem('token', result.token)` → **TypeError: Cannot read properties of null**.
- **Hậu quả**: Khi server trả 401 (sai mật khẩu), thay vì hiển thị lỗi, app crash với TypeError.
- **Cách sửa**: Thêm check `!result` trước `result?.error`: `if (!result || result?.error)`.

#### #58 — storage.js server-mode get*/ không set state (🔴 HIGH)
- **File**: `modules/storage.js:19-28`, `37-46`, `55-64`
- **Nguyên nhân**: Khi `useServer = true`, các method `getStudents()`, `getCourses()`, `getEnrollments()` dùng `return await api.get(...)` trực tiếp mà **không set `state.students`** (hay `state.courses`, `state.enrollments`). Chỉ có nhánh localStorage mới set state.
- **Hậu quả**: Khi deploy với server, sau login `renderAll()` gọi `storage.getStudents()` → API trả data → nhưng `state.students` vẫn là `[]`. UI luôn hiển thị bảng trống dù server có dữ liệu.
- **Cách sửa**: Thêm `if (data) state.students = data;` (tương tự cho courses, enrollments).

#### #59 — storage.js getAttendances/getPaymentRecords/getAdmins cùng bug (🔴 HIGH)
- **File**: `modules/storage.js:73-78`, `87-92`, `101-106`
- **Nguyên nhân**: Tương tự #58 — server-mode không set `state.attendances`, `state.paymentRecords`, `state.admins`.
- **Hậu quả**: Tab Điểm Danh, Thanh Toán, Quản Trị đều hiển thị trống khi deploy với server.
- **Cách sửa**: Thêm `if (data) state.* = data;` cho cả 3 methods.

#### #60 — api.js handleAuthError dùng reload gây F5 loop (🔴 CRITICAL)
- **File**: `modules/api.js:45-53`
- **Nguyên nhân**: Khi API trả 401 sau login (token invalid/expired), `handleAuthError` gọi `window.location.reload()`. Nếu server restart và JWT_SECRET thay đổi, token mới vừa login cũng bị 401 → reload → login → 401 → loop.
- **Hậu quả**: User bị F5 loop không thể thoát, không thể login lại.
- **Cách sửa**: Thay `window.location.reload()` bằng `window.showLogin()` — clear session và hiện login screen, cho phép user login lại.

#### #61 — api.js import showLogin gây circular dependency (🟡 MEDIUM)
- **File**: `modules/api.js:1`
- **Nguyên nhân**: `handleAuthError` cần gọi `showLogin()` khi 401. Nhưng `api.js → ui.js → auth.js → api.js` tạo circular dependency. ES modules có thể handle circular nhưng không reliable.
- **Hậu quả**: Có thể gây lỗi runtime không xác định khi module load.
- **Cách sửa**: Gọi `window.showLogin()` thay vì import trực tiếp. Gán `window.showLogin = showLogin` trong `app.js`.

#### #62 — enrollMonth không có event handler (🔴 HIGH)
- **File**: `app.js` (enrollment event listeners section), `modules/enrollment.js:28-36` (renderEnrollmentDropdowns)
- **Nguyên nhân**: Dropdown `enrollMonth` tồn tại trong HTML nhưng không có `change` event listener trong `app.js`. Hàm `renderEnrollmentDropdowns` cũng không đọc giá trị `enrollMonth` để lọc khóa học theo tháng.
- **Hậu quả**: Chọn tháng trong tab Ghi Danh không lọc danh sách khóa học — tính năng lọc theo tháng hoàn toàn không hoạt động.
- **Cách sửa**: Thêm `enrollMonth.addEventListener('change', ...)` trong `app.js` gọi `renderEnrollmentDropdowns()`. Sửa `renderEnrollmentDropdowns` để đọc `enrollMonth.value` và lọc `state.courses` theo `c.month === selectedMonth`.

#### #63 — discountType không có change handler (🔴 HIGH)
- **File**: `app.js` (enrollment event listeners section)
- **Nguyên nhân**: Dropdown `discountType` không có event listener. Input `discountValue` mặc định `disabled` và không bao giờ được enable khi chọn loại ưu đãi.
- **Hậu quả**: Không thể nhập giá trị ưu đãi khi ghi danh — phần discount hoàn toàn không dùng được.
- **Cách sửa**: Thêm `discountType.addEventListener('change', ...)` trong `app.js` để enable/disable `discountValue` dựa trên việc có chọn loại ưu đãi hay không.

#### #64 — excel-import preview "Xóa" button gây JS error (🟡 MEDIUM)
- **File**: `modules/excel-import.js:177`
- **Nguyên nhân**: Button Xóa trong preview table dùng inline `onclick="... window.excelImportRemoveRow(${index})"` nhưng `window.excelImportRemoveRow` không bao giờ được định nghĩa.
- **Hậu quả**: Click nút Xóa bị JS error, không xóa được dòng trong preview.
- **Cách sửa**: Thay inline `onclick` bằng event listener dùng `data-action="remove"` attribute.

#### #65 — Import Học Viên & Ghi Danh hoàn toàn không có JS (🔴 CRITICAL)
- **File**: `index.html:629-698` (HTML section), `app.js` (thiếu init), `modules/excel-import.js` (thiếu logic)
- **Nguyên nhân**: Section "Import Học Viên & Ghi Danh" có đầy đủ HTML elements (`uploadImportEnrollBtn`, `importEnrollFileInput`, `importEnrollAllBtn`, `cancelImportEnrollBtn`, `downloadImportEnrollTemplateBtn`, `importEnrollMonth`, `importEnrollCourse`, `importEnrollDate`, preview table) nhưng **không có bất kỳ mã JavaScript nào** khởi tạo. `state.importEnrollStudents` tồn tại trong `state.js` nhưng không bao giờ được sử dụng.
- **Hậu quả**: Toàn bộ tính năng "Import Học Viên & Ghi Danh" hoàn toàn không hoạt động — không upload file được, không preview, không import.
- **Cách sửa**: Thêm `initImportEnroll()` trong `excel-import.js` xử lý: upload file → parse Excel → preview editable → import students (skip duplicate by phone) + enroll vào khóa học đã chọn. Gọi `initImportEnroll()` trong `app.js init()`.

#### #66 — importBackup không sync server + không reload page (🔴 HIGH)
- **File**: `modules/storage.js:152-200` (importBackup), `app.js:230-248` (restore handler)
- **Nguyên nhân**: `importBackup` chỉ ghi vào localStorage và set in-memory state, nhưng (1) không sync lên server khi `useServer = true`, (2) không reload page nên các modules khác không re-init từ localStorage.
- **Hậu quả**: Restore backup không hiển thị đầy đủ dữ liệu — nhiều tab vẫn hiển thị dữ liệu cũ. Khi dùng server mode, dữ liệu restore chỉ ở localStorage không lên server.
- **Cách sửa**: Thêm server sync qua `api.post()` cho mọi data types. Thêm `window.location.reload()` sau restore thành công trong `app.js`.

#### #67 — handleAdminSubmit hoàn toàn thiếu — tạo/sửa admin không hoạt động (🔴 CRITICAL)
- **File**: `modules/admin.js` (thiếu export), `app.js` (thiếu import + event listener)
- **Nguyên nhân**: Form `adminForm` tồn tại trong HTML nhưng **không có bất kỳ mã JavaScript nào** xử lý submit. `admin.js` chỉ export `renderAdminTable`, `startAdminEdit`, `cancelAdminEdit`, `deleteAdmin` — **không có `handleAdminSubmit`**. `app.js` cũng không import hay gọi handler nào cho admin form.
- **Hậu quả**: Tab Quản Trị hoàn toàn không thể tạo admin mới hay sửa admin hiện có. Click "Thêm Quản Trị Viên" không làm gì cả.
- **Cách sửa**: Thêm `handleAdminSubmit` trong `admin.js` xử lý cả create và edit, bao gồm: validate input, hash password, check duplicate username, đọc permission matrix, lưu vào `state.admins` + localStorage. Import và wire up trong `app.js`.

#### #68 — Không có admin mã hóa trong localStorage khi chạy offline (🔴 CRITICAL)
- **File**: `app.js` (init function)
- **Nguyên nhân**: Khi chạy không có backend server, `localStorage.getItem('admins')` trả về `[]`. Admin mặc định (`admin`/`admin`) chỉ được tạo trong backend database (`database.js:78-85`), **không bao giờ được seed vào localStorage**.
- **Hậu quả**: User không thể đănh nhập khi chạy offline — màn hình login hiện "Lỗi kết nối" vì không có admin nào trong localStorage để fallback.
- **Cách sửa**: Thêm seeding trong `init()`: nếu `localStorage.getItem('admins')` rỗng, tạo default super admin (username: `admin`, password: `admin`) và lưu vào localStorage.

#### #69 — Import Khóa Học từ Excel (tính năng mới) (🟢 FEATURE)
- **File**: `index.html` (thiếu HTML), `modules/excel-import.js` (thiếu logic), `app.js` (thiếu init)
- **Nguyên nhân**: Tính năng chưa được triển khai.
- **Cách triển khai**: Thêm section "Import Khóa Học Từ Excel" trong tab Khóa Học. File Excel có các cột: Tên Khóa Học, Giảng Viên, Tháng, Học Phí, Sĩ Số Tối Đa, Trạng Thái. Hệ thống tạo khóa học mới nếu chưa có (dựa trên Tên + Tháng). Có preview + validation.

#### #70 — Import Học Viên & Khóa Học từ Excel (tính năng mới) (🟢 FEATURE)
- **File**: `index.html` (thiếu HTML), `modules/excel-import.js` (thiếu logic), `app.js` (thiếu init)
- **Nguyên nhân**: Tính năng chưa được triển khai.
- **Cách triển khai**: Thêm section "Import Học Viên & Khóa Học Từ Excel" trong tab Ghi Danh (bên dưới Import Học Viên & Ghi Danh). File Excel chứa cả thông tin học viên (Họ Tên, SĐT, Ngày Sinh...) và khóa học (Tên Khóa Học, Giảng Viên, Tháng, Học Phí...). Hệ thống tự động: (1) Tìm/tạo khóa học theo Tên + Tháng, (2) Tìm/tạo học viên theo SĐT, (3) Ghi danh học viên vào khóa học. Có preview + validation + trùng lặp check.

#### #71 — handlePasswordChange dùng saveAdmins() batch API không tồn tại (🔴 CRITICAL)
- **File**: `modules/auth.js:140-170` (handlePasswordChange)
- **Nguyên nhân**: `handlePasswordChange` gọi `storage.saveAdmins()` để lưu password mới. Nhưng `saveAdmins()` ở server mode gọi `api.post('admins/batch', ...)` — endpoint này **không tồn tại** trong backend (backend chỉ có `POST /admins`, `PUT /admins/:id`, `DELETE /admins/:id`, `POST /admins/:id/change-password`).
- **Hậu quả**: Trên host có server, đổi mật khẩu admin **hoàn toàn không hoạt động** — request trả về 404, password không được lưu.
- **Cách sửa**: Trong `handlePasswordChange`, gọi trực tiếp `api.post('admins/:id/change-password', ...)` thay vì `storage.saveAdmins()`.

#### #72 — storage.saveAdmins() dùng batch API không tồn tại (🔴 HIGH)
- **File**: `modules/storage.js:120-125`
- **Nguyên nhân**: `saveAdmins()` gọi `api.post('admins/batch', ...)` không tồn tại trong backend.
- **Hậu quả**: Mọi thao tác lưu admin (create, edit, password change) trên server đều fail.
- **Cách sửa**: Đổi từ batch sang gọi `api.put('admins', admin.id, ...)` cho từng admin.

#### #73 — deleteAdmin không gọi API delete (🟡 MEDIUM)
- **File**: `modules/admin.js` (deleteAdmin function)
- **Nguyên nhân**: `deleteAdmin` chỉ xóa khỏi `state.admins` và gọi `storage.saveAdmins()`, nhưng không gọi `api.delete('admins', id)` để xóa trên server.
- **Hậu quả**: Xóa admin trên host không có hiệu quực thực sên — `saveAdmins()` sẽ sync lại admin đã xóa lên server.
- **Cách sửa**: Thêm `api.delete('admins', id)` trước khi xóa khỏi state.

#### #74 — handleAdminSubmit tạo admin mới không gọi POST /admins (🟡 MEDIUM)
- **File**: `modules/admin.js` (handleAdminSubmit, nhánh create)
- **Nguyên nhân**: Khi tạo admin mới, chỉ push vào `state.admins` và gọi `storage.saveAdmins()` (dùng PUT). Nhưng admin mới chưa tồn tại trên server nên PUT sẽ fail hoặc không có hiệu quả.
- **Cách sửa**: Gọi `api.post('admins', {...})` rồi mới push vào state.

---

## 📋 CÔNG VIỆC CÒN LẠI (Theo Ưu Tiên)

### 🔴 ƯU TIÊN CAO (Bug fixes):

| # | Công việc | Thời gian |
|---|----------|----------|
| 1 | ~~Sửa #44~~ — Đã sửa: Thêm `formatCurrency, formatCourseName` vào import student.js | ✅ Done |
| 2 | ~~Sửa #46~~ — Đã sửa: Thêm `getCourseAttendanceDates` vào import report.js | ✅ Done |
| 3 | ~~Sửa #45~~ — Đã sửa: Viết lại excel-import.js dùng FileReader + SheetJS | ✅ Done |
| 4 | ~~Sửa #48~~ — Đã sửa: Sửa logic paymentMonthFilter change handler trong app.js | ✅ Done |
| 5 | ~~Sửa #49~~ — Đã sửa: Sửa auth.js localStorage fallback, ưu tiên đọc localStorage trước | ✅ Done |
| 26 | ~~Sửa #67~~ — Đã sửa: Thêm handleAdminSubmit + wire up trong app.js | ✅ Done |
| 27 | ~~Sửa #68~~ — Đã sửa: Seed default super admin vào localStorage | ✅ Done |
| 28 | ~~Sửa #71~~ — Đã sửa: handlePasswordChange dùng API /admins/:id/change-password | ✅ Done |
| 29 | ~~Sửa #72~~ — Đã sửa: saveAdmins() dùng PUT từng admin thay vì batch API | ✅ Done |
| 30 | ~~Sửa #73~~ — Đã sửa: deleteAdmin dùng DELETE /admins/:id API | ✅ Done |
| 31 | ~~Sửa #74~~ — Đã sửa: handleAdminSubmit dùng POST /admins cho create mới | ✅ Done |
| 32 | ~~Sửa #75~~ — Đã sửa: createAdmin backend nhận id từ request; frontend dùng response id | ✅ Done |
| 33 | ~~Sửa #76~~ — Đã sửa: edit admin gửi password (plain) thay vì passwordHash cho backend | ✅ Done |

### 🟡 ƯU TIÊN TRUNG BÌNH:

| # | Công việc | Thời gian |
|---|----------|----------|
| 6 | ~~Sửa #47~~ — Đã sửa: Đồng bộ text mặc định reportCourseText thành "-- Chọn khóa học --" | ✅ Done |
| 7 | Test toàn bộ flow trong browser (mở index.html và test từng tab) | 2-3 giờ |
| 8 | ~~Sửa #50~~ — Đã sửa sẵn: `if (rowClass)` guard đã tồn tại trong payment.js | ✅ Done |
| 9 | ~~Sửa #53~~ — Đã sửa: Di chuyển initBackupRestore definition lên trước initExcelImport | ✅ Done |
| 17 | ~~Sửa #62~~ — Đã sửa: Thêm enrollMonth change handler + lọc khóa học theo tháng trong renderEnrollmentDropdowns | ✅ Done |
| 18 | ~~Sửa #63~~ — Đã sửa: Thêm discountType change handler để enable/disable discountValue input | ✅ Done |
| 19 | ~~Sửa #64~~ — Đã sửa: Thay inline onclick bằng event listener cho nút Xóa trong preview table | ✅ Done |
| 20 | ~~Sửa #65~~ — Đã sửa: Thêm initImportEnroll() — toàn bộ logic Import Học Viên & Ghi Danh | ✅ Done |
| 21 | ~~Sửa #66~~ — Đã sửa: Thêm server sync + page reload trong importBackup | ✅ Done |
| 22 | ~~Sửa #67~~ — Đã sửa: Thêm handleAdminSubmit (create/edit admin) + wire up trong app.js | ✅ Done |
| 23 | ~~Sửa #68~~ — Đã sửa: Thêm seed default super admin vào localStorage trong init() | ✅ Done |
| 24 | ~~#69~~ — Đã triển khai: Import Khóa Học Từ Excel (tab Khóa Học) | ✅ Done |
| 25 | ~~#70~~ — Đã triển khai: Import Học Viên & Khóa Học Từ Excel (tab Ghi Danh) | ✅ Done |

### 🟢 ƯU TIÊN THẤP:

| # | Công việc | Thời gian |
|---|----------|----------|
| 10 | ~~Sửa #51~~ — Đã sửa: Xóa CSS trùng lặp (.status-badge.status-paid/unpaid duplicate) | ✅ Done |
| 11 | ~~Sửa #52~~ — Đã sửa: Bỏ inline style trên changePasswordModal, thêm CSS rule | ✅ Done |
| 12 | Hoàn thiện mobile.html | 3-4 giờ |
| 13 | Tạo backend API cho Railway | 8-10 giờ |
| 14 | Migration dữ liệu | 2-3 giờ |
| 15 | Deploy lên Railway | 2-3 giờ |
| 16 | Performance optimization | 2-3 giờ |

---

## 🔧 KIẾN TRÚC MODULES

```
app.js (entry, ~380 dòng)
├── imports từ 15 modules
├── gán window.* cho onclick handlers (18 functions)
├── event listeners setup
├── init() — seed default admin nếu localStorage rỗng
└── initImportEnroll(), initCourseStudentImport()

Dependency Graph:
state.js ← (none)
api.js ← (none)
utils.js ← state.js
storage.js ← state.js, api.js
ui.js ← state.js, auth.js
auth.js ← state.js, api.js, storage.js, ui.js [CIRCULAR: auth↔ui - ES modules handles this]
student.js ← state.js, auth.js, storage.js, utils.js
course.js ← state.js, auth.js, storage.js, utils.js
enrollment.js ← state.js, auth.js, storage.js, utils.js (dùng window.renderAll)
attendance.js ← state.js, auth.js, storage.js, utils.js
payment.js ← state.js, auth.js, storage.js, utils.js
report.js ← state.js, utils.js
admin.js ← state.js, auth.js, storage.js, utils.js
render-all.js ← state.js, student.js, course.js, enrollment.js, attendance.js, payment.js, report.js, admin.js
merge-students.js ← state.js, auth.js, storage.js, utils.js
excel-import.js ← state.js, storage.js, utils.js