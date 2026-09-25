import { api } from './client'

export const admissionEnquiriesApi = {
  create: (payload) => api.post('/admission-enquiries', payload, undefined, false),
  list: () => api.get('/admission-enquiries'),
}

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
  create: (data) => api.post('/users', data),
  updateStatus: (id, isActive) =>
    api.patch(`/users/${id}/status`, { isActive }),
  updateRole: (id, role) =>
    api.patch(`/users/${id}/role`, { role }),
  activity: (id) => api.get(`/users/${id}/activity`),
  forcePasswordReset: (id) =>
    api.post(`/users/${id}/force-password-reset`),
}

// Students
export const studentsApi = {
  list: (params) => api.get('/students', params),
  get: (id) => api.get(`/students/${id}`),
  profile: (id) => api.get(`/students/${id}/profile`),
  create: (data) => api.post('/students', data),
  onboard: (data) => api.post('/students/onboard', data),
  importCsv: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const accepted = await api.post('/students/import-csv', formData)
    if (!accepted?.jobId) {
      throw { message: 'Import did not return a job id' }
    }
    const terminal = new Set(['COMPLETED', 'FAILED'])
    if (terminal.has(accepted.status)) {
      return api.get(`/students/import-csv/jobs/${accepted.jobId}`)
    }
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const job = await api.get(`/students/import-csv/jobs/${accepted.jobId}`)
      if (terminal.has(job.status)) {
        return job
      }
    }
    throw { message: 'Import timed out while waiting for results' }
  },
  getImportCsvJob: (jobId) => api.get(`/students/import-csv/jobs/${jobId}`),
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
  publishedReports: (id) => api.get(`/students/${id}/published-reports`),
  publishedAssessment: (id, params) =>
    api.get(`/students/${id}/published-reports/assessment-sheets`, params),
  publishedAssessmentPdf: (id, params) =>
    api.get(`/students/${id}/published-reports/assessment-sheets/pdf`, params),
  publishedBehavioural: (id, params) =>
    api.get(`/students/${id}/published-reports/behavioural`, params),
  publishedBehaviouralPdf: (id, params) =>
    api.get(`/students/${id}/published-reports/behavioural/pdf`, params),
  publishedPreschool: (id, params) =>
    api.get(`/students/${id}/published-reports/preschool`, params),
  publishedPreschoolPdf: (id, params) =>
    api.get(`/students/${id}/published-reports/preschool/pdf`, params),
}

// Enrollments
export const enrollmentsApi = {
  bulkPromote: (data) =>
    api.post('/enrollments/bulk-promote', data),
}

// Dashboards
export const dashboardApi = {
  admin: () => api.get('/dashboard/admin'),
  activity: (limit = 50) => api.get('/dashboard/activity', { limit }),
  teacher: (params) => api.get('/dashboard/teacher', params),
}

// Parents
export const parentsApi = {
  me: () => api.get('/parents/me'),
  updateMe: (data) => api.patch('/parents/me', data),
  dashboard: (studentId) => api.get('/parents/me/dashboard', { studentId }),
  list: (params) => api.get('/parents', params),
  get: (id) => api.get(`/parents/${id}`),
  create: (data) => api.post('/parents', data),
  linkStudent: (id, studentId) =>
    api.post(`/parents/${id}/students`, { studentId }),
  createAndLinkStudent: (id, data) =>
    api.post(`/parents/${id}/students/create`, data),
  unlinkStudent: (id, studentId) =>
    api.delete(`/parents/${id}/students/${studentId}`),
}

// Teachers
export const teachersApi = {
  list: (params) => api.get('/teachers', params),
  get: (id) => api.get(`/teachers/${id}`),
  profile: (id) => api.get(`/teachers/${id}/profile`),
  update: (id, data) => api.patch(`/teachers/${id}`, data),
  onboard: (data) => api.post('/teachers/onboard', data),
  importCsv: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const accepted = await api.post('/teachers/import-csv', formData)
    if (!accepted?.jobId) {
      throw { message: 'Import did not return a job id' }
    }
    const terminal = new Set(['COMPLETED', 'FAILED'])
    if (terminal.has(accepted.status)) {
      return api.get(`/teachers/import-csv/jobs/${accepted.jobId}`)
    }
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const job = await api.get(`/teachers/import-csv/jobs/${accepted.jobId}`)
      if (terminal.has(job.status)) {
        return job
      }
    }
    throw { message: 'Import timed out while waiting for results' }
  },
  getImportCsvJob: (jobId) => api.get(`/teachers/import-csv/jobs/${jobId}`),
  classes: (teacherId) => api.get(`/teachers/${teacherId}/classes`),
  assignClass: (teacherId, classId) =>
    api.post(`/teachers/${teacherId}/classes`, undefined, { classId }),
  reassignClass: (teacherId, classId) =>
    api.post(`/teachers/${teacherId}/classes/reassign`, undefined, { classId }),
  unassignClass: (teacherId, classId) =>
    api.post(`/teachers/${teacherId}/classes/unassign`, undefined, { classId }),
  listSubjects: (teacherId) => api.get(`/teachers/${teacherId}/subjects`),
  assignSubject: (teacherId, classId, subjectId) =>
    api.post(`/teachers/${teacherId}/subjects`, undefined, { classId, subjectId }),
  unassignSubject: (teacherId, classId, subjectId) =>
    api.delete(`/teachers/${teacherId}/subjects`, { classId, subjectId }),
  timetable: (teacherId) => api.get(`/teachers/${teacherId}/timetable`),
  createTimetableSlot: (teacherId, data) =>
    api.post(`/teachers/${teacherId}/timetable`, data),
  updateTimetableSlot: (teacherId, slotId, data) =>
    api.put(`/teachers/${teacherId}/timetable/${slotId}`, data),
  deleteTimetableSlot: (teacherId, slotId) =>
    api.delete(`/teachers/${teacherId}/timetable/${slotId}`),
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
  get: (id, params) => api.get(`/classes/${id}`, params),
  create: ({ name, classGroup }) => api.post('/classes', { name, classGroup }),
  update: (id, { name, classGroup, isActive }) =>
    api.put(`/classes/${id}`, { name, classGroup, isActive }),
  subjects: (classId) => api.get(`/classes/${classId}/subjects`),
  assignSubject: (classId, subjectId) =>
    api.post(`/classes/${classId}/subjects`, { subjectId }),
  unassignSubject: (classId, subjectId) =>
    api.delete(`/classes/${classId}/subjects/${subjectId}`),
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
  get: (id) => api.get(`/subjects/${id}`),
  create: (name) => api.post('/subjects', { name }),
  update: (id, data) => api.patch(`/subjects/${id}`, data),
  remove: (id) => api.delete(`/subjects/${id}`),
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

export const behaviouralReportsApi = {
  list: (params) => api.get('/behavioural-reports', params),
  save: (data) => api.put('/behavioural-reports', data),
  publish: (data) => api.post('/behavioural-reports/publish', data),
}

export const assessmentSheetsApi = {
  get: (params) => api.get('/assessment-sheets', params),
  save: (data) => api.put('/assessment-sheets', data),
  publish: (data) => api.post('/assessment-sheets/publish', data),
}

export const preschoolReportsApi = {
  get: (params) => api.get('/preschool-reports', params),
  save: (data) => api.put('/preschool-reports', data),
  publish: (data) => api.post('/preschool-reports/publish', data),
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
  reject: (termId, classId) =>
    api.post('/term-results/reject', { termId, classId }),
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

// Calendar
export const calendarApi = {
  list: ({ from, to } = {}) => api.get('/calendar/events', { from, to }),
  get: (id) => api.get(`/calendar/events/${id}`),
  create: (data) => api.post('/calendar/events', data),
  update: (id, data) => api.put(`/calendar/events/${id}`, data),
  remove: (id) => api.delete(`/calendar/events/${id}`),
}

// Announcements
export const announcementsApi = {
  list: (params) => api.get('/announcements', params),
  get: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.patch(`/announcements/${id}`, data),
  remove: (id) => api.delete(`/announcements/${id}`),
  inbox: () => api.get('/announcements/inbox'),
  mine: () => api.get('/announcements/mine'),
}

// Attendance
export const attendanceApi = {
  daily: (date) => api.get('/attendance/daily', { date }),
  byClass: (classId, date) => api.get('/attendance/class', { classId, date }),
  byPupil: (studentId, from, to) =>
    api.get('/attendance/pupil', { studentId, from, to }),
  absences: ({ from, to, classId } = {}) =>
    api.get('/attendance/absences', { from, to, classId }),
  markClass: ({ classId, date, marks }) =>
    api.post('/attendance/class/mark', { classId, date, marks }),
  staff: (date) => api.get('/attendance/staff', { date }),
  staffByTeacher: (teacherId, from, to) =>
    api.get('/attendance/staff/teacher', { teacherId, from, to }),
  markStaff: ({ date, marks }) =>
    api.post('/attendance/staff/mark', { date, marks }),
}

// Fees
export const feesApi = {
  schoolTemplate: () => api.get('/fees/templates/school'),
  saveSchoolTemplate: (data) => api.put('/fees/templates/school', data),
  template: (classId) => api.get(`/fees/templates/${classId}`),
  saveTemplate: (classId, data) => api.put(`/fees/templates/${classId}`, data),
  structures: (classId, termId) =>
    api.get('/fees/structures', { classId, termId }),
  ensureFromTemplate: (classId, termId) =>
    api.post('/fees/structures/ensure-from-template', undefined, { classId, termId }),
  batchAmounts: (items) => api.put('/fees/structures/batch-amounts', { items }),
  createStructure: (data) => api.post('/fees/structures', data),
  updateStructure: (id, data) => api.patch(`/fees/structures/${id}`, data),
  removeStructure: (id) => api.delete(`/fees/structures/${id}`),
  publish: (classId, termId) =>
    api.post('/fees/structures/publish', undefined, { classId, termId }),
  republishPreview: (classId, termId) =>
    api.get('/fees/republish-preview', { classId, termId }),
  republish: (classId, termId) =>
    api.post('/fees/structures/republish', undefined, { classId, termId }),
  invoices: ({ termId, classId } = {}) =>
    api.get('/fees/invoices', { termId, classId }),
  markPaid: (id) => api.post(`/fees/invoices/${id}/mark-paid`),
  my: () => api.get('/fees/my'),
  generateForStudent: (studentId) =>
    api.post(`/fees/students/${studentId}/generate`),
  initializePayment: ({ sessionId, termId } = {}) =>
    api.post('/fees/payments/initialize', undefined, { sessionId, termId }),
  verifyPayment: (reference) =>
    api.post('/fees/payments/verify', { reference }),
}
