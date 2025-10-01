import axios from 'axios';

const API_URL = 'http://localhost:3300/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Authentication API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

// Employee API
export const employeeAPI = {
    applyLeave: (leaveData) => api.post('/employee/apply-leave', leaveData),
    getMyLeaves: () => api.get('/employee/my-leaves'),
    getMyBalances: () => api.get('/employee/my-balances'),
    getLeaveTypes: () => api.get('/employee/leave-types')
};

// Manager API
export const managerAPI = {
    getPendingLeaves: () => api.get('/manager/pending-leaves'),
    getTeamLeaves: () => api.get('/manager/team-leaves'),
    approveLeave: (applicationId) => api.post(`/manager/approve/${applicationId}`),
    rejectLeave: (applicationId, reason) => api.post(`/manager/reject/${applicationId}`, { rejection_reason: reason }),
    getTeamMembers: () => api.get('/manager/team-members')
};

// HR API
export const hrAPI = {
    getAllUsers: () => api.get('/hr/users'),
    createUser: (userData) => api.post('/hr/users', userData),
    updateUser: (userId, userData) => api.put(`/hr/users/${userId}`, userData),
    deleteUser: (userId) => api.delete(`/hr/users/${userId}`),
    assignManager: (userId, managerId) => api.put('/hr/assign-manager', { user_id: userId, manager_id: managerId }),
    getAllLeaves: () => api.get('/hr/all-leaves'),
    getRejectedLeaves: () => api.get('/hr/rejected-leaves'),
    getLeaveTypes: () => api.get('/hr/leave-types'),
    createLeaveType: (leaveTypeData) => api.post('/hr/leave-types', leaveTypeData),
    updateLeaveType: (leaveTypeId, leaveTypeData) => api.put(`/hr/leave-types/${leaveTypeId}`, leaveTypeData),
    deleteLeaveType: (leaveTypeId) => api.delete(`/hr/leave-types/${leaveTypeId}`)
};

export default api;