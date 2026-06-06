// modules/ui.js - UI helper functions
import { state } from './state.js';
import { checkPermission } from './auth.js';

export const switchTab = tab => {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === 'tab-' + tab);
    });
};

export const showLogin = () => {
    const loginOverlay = document.getElementById('loginOverlay');
    const appLayout = document.getElementById('appLayout');
    
    if (loginOverlay) loginOverlay.style.display = 'flex';
    if (appLayout) appLayout.style.display = 'none';
    
    const loginError = document.getElementById('loginError');
    if (loginError) loginError.textContent = '';
    
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    
    if (loginUsername) loginUsername.value = '';
    if (loginPassword) loginPassword.value = '';
};

export const showApp = () => {
    const loginOverlay = document.getElementById('loginOverlay');
    const appLayout = document.getElementById('appLayout');
    
    if (loginOverlay) loginOverlay.style.display = 'none';
    if (appLayout) appLayout.style.display = 'flex';
    
    const currentUserName = document.getElementById('currentUserName');
    const navAdmin = document.getElementById('navAdmin');
    
    if (currentUserName && state.currentAdmin) {
        currentUserName.textContent = state.currentAdmin.name + (state.currentAdmin.role === 'super' ? ' (Super)' : '');
    }
    if (navAdmin && state.currentAdmin) {
        navAdmin.style.display = state.currentAdmin.role === 'super' ? 'flex' : 'none';
    }

    const importEnrollDate = document.getElementById('importEnrollDate');
    if (importEnrollDate) {
        importEnrollDate.value = new Date().toISOString().split('T')[0];
    }

    applyPermissions();
};

export const applyPermissions = () => {
    document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
        const tab = btn.dataset.tab;
        if (tab === 'admin') return;
        btn.style.display = checkPermission(tab, 'view') ? 'flex' : 'none';
    });

    const activeBtn = document.querySelector('.nav-btn.active');
    if (activeBtn?.style.display === 'none') {
        const firstVisible = document.querySelector('.nav-btn[data-tab]:not([style*="display: none"])');
        if (firstVisible) switchTab(firstVisible.dataset.tab);
    }

    const studentForm = document.getElementById('studentForm');
    const importSection = document.querySelector('#tab-students .form-section:nth-child(3)');
    const studentFormSection = studentForm?.closest('.form-section');
    
    if (studentFormSection) studentFormSection.style.display = checkPermission('students', 'add') ? 'block' : 'none';
    if (importSection) importSection.style.display = checkPermission('students', 'add') ? 'block' : 'none';

    const courseForm = document.getElementById('courseForm');
    const courseFormSection = courseForm?.closest('.form-section');
    if (courseFormSection) courseFormSection.style.display = checkPermission('courses', 'add') ? 'block' : 'none';

    const enrollmentForm = document.getElementById('enrollmentForm');
    const copySection = document.querySelector('#tab-enrollment .form-section:nth-child(2)');
    const enrollFormSection = enrollmentForm?.closest('.form-section');
    
    if (enrollFormSection) enrollFormSection.style.display = checkPermission('enrollment', 'add') ? 'block' : 'none';
    if (copySection) copySection.style.display = checkPermission('enrollment', 'add') ? 'block' : 'none';

    const attendFormSection = document.querySelector('#tab-attendance .form-section');
    const addDateBtn = document.getElementById('addDateBtn');
    const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');
    
    if (addDateBtn) addDateBtn.style.display = checkPermission('attendance', 'add') ? 'inline-block' : 'none';
    if (saveAttendanceBtn) saveAttendanceBtn.style.display = checkPermission('attendance', 'edit') ? 'inline-block' : 'none';

    const backupSection = document.getElementById('backupRestoreSection');
    if (backupSection && state.currentAdmin) {
        backupSection.style.display = state.currentAdmin.role === 'super' ? 'block' : 'none';
    }
};