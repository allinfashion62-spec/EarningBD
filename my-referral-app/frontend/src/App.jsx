import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import { useState } from 'react'

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null)

  const ProtectedRoute = ({ children, adminOnly }) => {
    if (!user) return <Navigate to="/login" />
    if (adminOnly && !user.isAdmin) return <Navigate to="/" />
    return children
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard user={user} setUser={setUser} /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App