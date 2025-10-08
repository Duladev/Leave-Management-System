Diamond-Leave-Solution


Leave request and manage system UI & UX Design https://www.figma.com/design/poANh7kj6AYmIliR8purUZ/Diamond-Leave-Solution?node-id=0-1&t=TH8fmSt2RbfZVody-1

Database Schema https://drawsql.app/teams/diamond-5/diagrams/leave-system

MERN stack Vs MESN stack https://rameezibrahim.medium.com/building-a-full-stack-application-with-mern-and-sql-65d378309886

Frontend - npm install
Backend - npm start

[auth without password hashing method](backend/routes/auth.js)

README.md
pages
--apply_leaves
--dashboard
--login
--manage_department
--manage_leave_balance
--manage_users
--my_leaves
--pending_leaves
--rejected_leaves
--team_leaves


hr access
--dashboard
--login
--manage_department
--manage_leave_balance
--manage_leaves
--rejected_leave

management access
--login
--apply-leaves
--my_leaves
--pending_leaves
--team_leaves
--rejected_leaves

employee access
--login
--my_leaves
--apply_leaves
--pending_leaves

routes
--auth.js
--employee.js
--hr.js
--manager.js

models
--department.js
--leaveapplication.js
--leavebalance.js
--user.js

middlware
--auth.js

configuration
--database.js

services
--api.js

APIs
auth
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password })
};
employee
export const employeeAPI = {
    applyLeave: (leaveData) => api.post('/employee/apply-leave', leaveData),
    getMyLeaves: () => api.get('/employee/my-leaves'),
    getMyBalances: () => api.get('/employee/my-balances')
};
manager
export const managerAPI = {
    getPendingLeaves: () => api.get('/manager/pending-leaves'),
    getTeamLeaves: () => api.get('/manager/team-leaves'),
    approveLeave: (applicationId) => api.post(`/manager/approve/${applicationId}`),
    rejectLeave: (applicationId, reason) => api.post(`/manager/reject/${applicationId}`, { rejection_reason: reason })
};
hr
export const hrAPI = {
    getAllUsers: () => api.get('/hr/users'),
    createUser: (userData) => api.post('/hr/users', userData),
    assignManager: (userId, managerId) => api.put('/hr/assign-manager',{ user_id: userId, manager_id: managerId }),
    getAllLeaves: () => api.get('/hr/all-leaves'),

department
    getDepartments: () => api.get('/hr/departments'),
    createDepartment: (departmentData) => api.post('/hr/departments', departmentData),
    deleteDepartment: (departmentId) => api.delete(`/hr/departments/${departmentId}`),
    getEmployeeBalances: (userId) => api.get(`/hr/employee-balances/${userId}`),
    initializeLeaveBalances: (userId) => api.post(`/hr/initialize-balances/${userId}`),
    updateLeaveBalance: (balanceId, balanceData) => api.put(`/hr/update-balance/${balanceId}`, balanceData)
};