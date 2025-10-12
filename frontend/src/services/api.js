import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API Request:', config.method.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('API Response Error:', error.response?.status, error.response?.data);

        // Handle authentication errors
        if (error.response?.status === 401) {
            const errorCode = error.response?.data?.code;
            if (errorCode === 'INVALID_TOKEN' || errorCode === 'NO_TOKEN') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password })
};

export const employeeAPI = {
    applyLeave: (leaveData) => api.post('/employee/apply-leave', leaveData),
    getMyLeaves: () => api.get('/employee/my-leaves'),
    getMyBalances: () => api.get('/employee/my-balances'),
    getShortLeaveCount: () => api.get('/employee/short-leave-count')
};

export const managerAPI = {
    getPendingLeaves: () => api.get('/manager/pending-leaves'),
    getTeamLeaves: () => api.get('/manager/team-leaves'),
    approveLeave: (applicationId) => api.post(`/manager/approve/${applicationId}`),
    rejectLeave: (applicationId, reason) => api.post(`/manager/reject/${applicationId}`, { rejection_reason: reason })
};

export const hrAPI = {
    getAllUsers: () => api.get('/hr/users'),
    createUser: (userData) => api.post('/hr/users', userData),
    assignManager: (userId, managerId) => api.put('/hr/assign-manager', { user_id: userId, manager_id: managerId }),
    getAllLeaves: () => api.get('/hr/all-leaves'),
    getDepartments: () => api.get('/hr/departments'),
    createDepartment: (departmentData) => api.post('/hr/departments', departmentData),
    deleteDepartment: (departmentId) => api.delete(`/hr/departments/${departmentId}`),
    getEmployeeBalances: (userId) => api.get(`/hr/employee-balances/${userId}`),
    initializeLeaveBalances: (userId) => api.post(`/hr/initialize-balances/${userId}`),
    updateLeaveBalance: (balanceId, balanceData) => api.put(`/hr/update-balance/${balanceId}`, balanceData)
};

export default api;