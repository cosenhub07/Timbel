import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MobileBottomNav from './components/MobileBottomNav'
import LandingPage from './pages/LandingPage'
import FinderPage from './pages/FinderPage'
import ClassTimetablePage from './pages/ClassTimetablePage'
import AdminPage from './pages/AdminPage'
import TeacherStatusPage from './pages/TeacherStatusPage'
import ProfilePage from './pages/ProfilePage'
import AIAssistantWidget from './components/AIAssistantWidget'
import SendiYouPage from './pages/SendiYouPage'
import PostDetailPage from './pages/PostDetailPage'
import ChatPage from './pages/ChatPage'
import MessagesPage from './pages/MessagesPage'
import ProtectedRoute from './components/ProtectedRoute'
import AttendancePlannerPage from './pages/AttendancePlannerPage'
import PWANotificationPrompt from './components/PWANotificationPrompt'

function App() {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'
  const isSendiYouSection = location.pathname.startsWith('/sendiyou')
  const isAdminSection = location.pathname.startsWith('/admin')
  const showAssistant = !isLandingPage && !isSendiYouSection && !isAdminSection

  return (
    <div className="min-h-screen flex flex-col bg-slate-darker">
      <Navbar />
      {showAssistant && <AIAssistantWidget />}
      <PWANotificationPrompt />
      <main className="flex-1 pb-16 md:pb-0"> {/* Padding bottom for mobile nav */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/finder" element={<ProtectedRoute><FinderPage /></ProtectedRoute>} />
          <Route path="/classes" element={<ProtectedRoute><ClassTimetablePage /></ProtectedRoute>} />
          <Route path="/teachers" element={<ProtectedRoute><TeacherStatusPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/sendiyou" element={<ProtectedRoute><SendiYouPage /></ProtectedRoute>} />
          <Route path="/sendiyou/post/:postId" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
          <Route path="/chat/:chatId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AttendancePlannerPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      {isLandingPage && <Footer />}
      <MobileBottomNav />
    </div>
  )
}

export default App
