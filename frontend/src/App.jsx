import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'

// Auth
import LoginPage from './pages/auth/LoginPage'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AcademicStructure from './pages/admin/AcademicStructure'
import FacultyManagement from './pages/admin/FacultyManagement'
import StudentManagement from './pages/admin/StudentManagement'
import AllQuizzes from './pages/admin/AllQuizzes'
import SystemAnalytics from './pages/admin/SystemAnalytics'
import AuditLogs from './pages/admin/AuditLogs'

// Faculty
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import CreateQuizManual from './pages/faculty/CreateQuizManual'
import CreateQuizAI from './pages/faculty/CreateQuizAI'
import CreateQuizPDF from './pages/faculty/CreateQuizPDF'
import QuizManagement from './pages/faculty/QuizManagement'
import QuizAnalytics from './pages/faculty/QuizAnalytics'

// Student
import StudentDashboard from './pages/student/StudentDashboard'
import QuizList from './pages/student/QuizList'
import QuizAttempt from './pages/student/QuizAttempt'
import QuizResult from './pages/student/QuizResult'
import PerformanceHistory from './pages/student/PerformanceHistory'

// Misc
import Unauthorized from './pages/Unauthorized'
import RoleRedirect from './pages/RoleRedirect'

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Root → redirect based on role */}
                    <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

                    {/* ─── Admin ─── */}
                    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/academic" element={<ProtectedRoute allowedRoles={['admin']}><AcademicStructure /></ProtectedRoute>} />
                    <Route path="/admin/faculty" element={<ProtectedRoute allowedRoles={['admin']}><FacultyManagement /></ProtectedRoute>} />
                    <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><StudentManagement /></ProtectedRoute>} />
                    <Route path="/admin/quizzes" element={<ProtectedRoute allowedRoles={['admin']}><AllQuizzes /></ProtectedRoute>} />
                    <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><SystemAnalytics /></ProtectedRoute>} />
                    <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AuditLogs /></ProtectedRoute>} />

                    {/* ─── Faculty ─── */}
                    <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
                    <Route path="/faculty/quiz/create/manual" element={<ProtectedRoute allowedRoles={['faculty']}><CreateQuizManual /></ProtectedRoute>} />
                    <Route path="/faculty/quiz/edit/:id" element={<ProtectedRoute allowedRoles={['faculty']}><CreateQuizManual editMode={true} /></ProtectedRoute>} />
                    <Route path="/faculty/quiz/create/ai" element={<ProtectedRoute allowedRoles={['faculty']}><CreateQuizAI /></ProtectedRoute>} />
                    <Route path="/faculty/quiz/create/pdf" element={<ProtectedRoute allowedRoles={['faculty']}><CreateQuizPDF /></ProtectedRoute>} />
                    <Route path="/faculty/quizzes" element={<ProtectedRoute allowedRoles={['faculty']}><QuizManagement /></ProtectedRoute>} />
                    <Route path="/faculty/analytics/:quizId" element={<ProtectedRoute allowedRoles={['faculty']}><QuizAnalytics /></ProtectedRoute>} />

                    {/* ─── Student ─── */}
                    <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
                    <Route path="/student/quizzes" element={<ProtectedRoute allowedRoles={['student']}><QuizList /></ProtectedRoute>} />
                    <Route path="/student/quiz/:quizId/attempt" element={<ProtectedRoute allowedRoles={['student']}><QuizAttempt /></ProtectedRoute>} />
                    <Route path="/student/quiz/:quizId/result" element={<ProtectedRoute allowedRoles={['student']}><QuizResult /></ProtectedRoute>} />
                    <Route path="/student/history" element={<ProtectedRoute allowedRoles={['student']}><PerformanceHistory /></ProtectedRoute>} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}
