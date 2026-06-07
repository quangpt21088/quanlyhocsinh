// modules/api.js - API client layer
const API_BASE = window.location.origin + '/api';

export class ApiClient {
    get token() {
        return localStorage.getItem('token');
    }

    get headers() {
        return {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: { ...this.headers, ...options.headers }
            });

            if (response.status === 401) {
                this.handleAuthError(endpoint);
                return null;
            }

            return await response.json();
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    }

    handleAuthError(endpoint) {
        // Don't reload on ping/auth endpoints to avoid infinite reload loops
        if (endpoint === '/ping' || endpoint === '/auth/login') {
            return;
        }
        // Don't reload if user is not logged in — renderAll may call API endpoints
        // before login, and 401 is expected when there's no session token
        if (!localStorage.getItem('token')) {
            return;
        }
        localStorage.removeItem('token');
        sessionStorage.removeItem('currentAdmin');
        window.location.reload();
    }

    async get(resource) {
        return await this.request(`/${resource}`);
    }

    async post(resource, data) {
        return await this.request(`/${resource}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(resource, id, data) {
        return await this.request(`/${resource}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(resource, id) {
        return await this.request(`/${resource}/${id}`, { method: 'DELETE' });
    }
}

export const api = new ApiClient();