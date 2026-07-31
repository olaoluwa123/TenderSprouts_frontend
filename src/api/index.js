import { api } from './client'

// Auth
export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }, undefined, false),
  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }, undefined, false),
  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }, undefined, false),
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }, undefined, false),
  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword }, undefined, false),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
}

// Users
export const usersApi = {
  list: (params) => api.get('/users', params),
  get: (id) => api.get(`/users/${id}`),
  updateStatus: (id, isActive) =>
    api.patch(`/users/${id}/status`, { isActive }),
  forcePasswordReset: (id) =>
    api.post(`/users/${id}/force-password-reset`),
}

// Students
export const studentsApi = {
  list: (params) => api.get('/students', params),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  onboard: (data) => api.post('/students/onboard', data),
  importCsv: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/students/import-csv', formData)
  },
  update: (id, data) => api.patch(`/students/${id}`, data),
  onboardParent: (id, data) =>
    api.post(`/students/${id}/onboard-parent`, data),
  createEnrollment: (id, data) =>
    api.post(`/students/${id}/enrollments`, data),
  enrollments: (id) => api.get(`/students/${id}/enrollments`),
  grades: (id, termId) => api.get(`/students/${id}/grades`, { termId }),
  examTimetable: (id, termId) =>
    api.get(`/students/${id}/exam-timetable`, { termId }),
  reportCard: (id, termId) =>
    api.get(`/students/${id}/report-cards/${termId}`),
  reportCardPdf: (id, termId) =>
    api.get(`/students/${id}/report-cards/${termId}/pdf`),
}

// Enrollments
export const enrollmentsApi = {
  bulkPromote: (data) =>
    api.post('/enrollments/bulk-promote', data),
}

// Dashboards
export const dashboardApi = {
  admin: () => api.get('/dashboard/admin'),
  teacher: () => api.get('/dashboard/teacher'),
}

// Parents
export const parentsApi = {
  me: () => api.get('/parents/me'),
  dashboard: (studentId) => api.get('/parents/me/dashboard', { studentId }),
  list: (params) => api.get('/parents', params),
  get: (id) => api.get(`/parents/${id}`),
  create: (data) => api.post('/parents', data),
  linkStudent: (id, studentId) =>
    api.post(`/parents/${id}/students`, { studentId }),
  unlinkStudent: (id, studentId) =>
    api.delete(`/parents/${id}/students/${studentId}`),
}

// Teachers
export const teachersApi = {
  onboard: (data) => api.post('/teachers/onboard', data),
  classes: (teacherId) => api.get(`/teachers/${teacherId}/classes`),
  assignClass: (teacherId, classId) =>
    api.post(`/teachers/${teacherId}/classes`, undefined, { classId }),
  reassignClass: (teacherId, classId) =>
    api.post(`/teachers/${teacherId}/classes/reassign`, undefined, { classId }),
  unassignClass: (teacherId) =>
    api.post(`/teachers/${teacherId}/classes/unassign`),
}

// Sessions
export const sessionsApi = {
  list: (params) => api.get('/sessions', params),
  active: () => api.get('/sessions/active'),
  activeTerm: () => api.get('/terms/active'),
  create: (data) => api.post('/sessions', data),
  activate: (id) => api.post(`/sessions/${id}/activate`),
  activateTerm: (sessionId, termId) => api.post(`/sessions/${sessionId}/terms/${termId}/activate`),
  terms: (id) => api.get(`/sessions/${id}/terms`),
}

// Classes
export const classesApi = {
  list: (params) => api.get('/classes', params),
  create: (name) => api.post('/classes', { name }),
  subjects: (classId) => api.get(`/classes/${classId}/subjects`),
  assignSubject: (classId, subjectId) =>
    api.post(`/classes/${classId}/subjects`, { subjectId }),
  bulkAssignSubjects: (classIds, subjectIds) =>
    api.post('/classes/subjects/bulk-assign', { classIds, subjectIds }),
  grades: (classId, termId, subjectId) =>
    api.get(`/classes/${classId}/grades`, { termId, subjectId }),
  examTimetable: (classId, termId, includeUnpublished = true) =>
    api.get(`/classes/${classId}/exam-timetable`, { termId, includeUnpublished }),
  createExamSlot: (classId, data) =>
    api.post(`/classes/${classId}/exam-timetable`, data),
  updateExamSlot: (classId, slotId, data) =>
    api.put(`/classes/${classId}/exam-timetable/${slotId}`, data),
  deleteExamSlot: (classId, slotId) =>
    api.delete(`/classes/${classId}/exam-timetable/${slotId}`),
  publishExamTimetable: (classId, termId) =>
    api.post(`/classes/${classId}/exam-timetable/publish`, undefined, { termId }),
}

// Subjects
export const subjectsApi = {
  list: (params) => api.get('/subjects', params),
  create: (name) => api.post('/subjects', { name }),
}

// Grades
export const gradesApi = {
  create: (data) => api.post('/grades', data),
  batch: (grades) => api.post('/grades/batch', { grades }),
  byStudent: (studentId, termId) =>
    api.get(`/grades/students/${studentId}`, { termId }),
  byClass: (classId, termId, subjectId) =>
    api.get(`/grades/classes/${classId}`, { termId, subjectId }),
  gradingSheet: (studentId, termId) =>
    api.get(`/students/${studentId}/grading-sheet`, { termId }),
  saveStudentGrades: (studentId, payload) =>
    api.put(`/students/${studentId}/grades`, payload),
}

// Term results
export const termResultsApi = {
  list: (params) => api.get('/term-results', params),
  get: (id) => api.get(`/term-results/${id}`),
  submission: (classId, termId) =>
    api.get('/term-results/submission', { classId, termId }),
  listSubmissions: (params) => api.get('/term-results/submissions', params),
  compute: (termId, classId, sessionId) =>
    api.post('/term-results/compute', { termId, classId, sessionId }),
  submit: (termId, classId, sessionId) =>
    api.post('/term-results/submit', { termId, classId, sessionId }),
  approve: (termId, classId) =>
    api.post('/term-results/approve', { termId, classId }),
  publish: (termId, classId) =>
    api.post('/term-results/publish', { termId, classId }),
  update: (id, data) => api.put(`/term-results/${id}`, data),
}

// Assessment types
export const assessmentTypesApi = {
  list: () => api.get('/assessment-types'),
  create: (data) => api.post('/assessment-types', data),
  update: (id, data) => api.put(`/assessment-types/${id}`, data),
}
