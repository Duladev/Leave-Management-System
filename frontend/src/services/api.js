import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
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

// Auth APIs
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (userData) => api.post('/auth/register', userData)
};

// Employee APIs
export const employeeAPI = {
    applyLeave: (leaveData) => api.post('/employee/apply-leave', leaveData),
    getMyLeaves: () => api.get('/employee/my-leaves'),
    getMyBalances: () => api.get('/employee/my-balances')
};

// Manager APIs
export const managerAPI = {
    getPendingLeaves: () => api.get('/manager/pending-leaves'),
    getTeamLeaves: () => api.get('/manager/team-leaves'),
    approveLeave: (applicationId) => api.post(`/manager/approve/${applicationId}`),
    rejectLeave: (applicationId, reason) => api.post(`/manager/reject/${applicationId}`, { rejection_reason: reason })
};

// HR APIs
export const hrAPI = {
    getAllUsers: () => api.get('/hr/users'),
    createUser: (userData) => api.post('/hr/users', userData),
    assignManager: (userId, managerId) => api.put('/hr/assign-manager', { user_id: userId, manager_id: managerId }),
    getAllLeaves: () => api.get('/hr/all-leaves')
};

export default api;