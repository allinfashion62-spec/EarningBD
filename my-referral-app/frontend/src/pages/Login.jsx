import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login({ setUser }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(import.meta.env.VITE_API_URL + '/api/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      if (res.data.user.isAdmin) navigate('/admin')
      else navigate('/')
    } catch (err) {
      alert('Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-lg w-96">
        <h2 className="text-2xl mb-6">Login</h2>
        <input className="w-full p-3 border mb-4" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" className="w-full p-3 border mb-4" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white py-3">Login</button>
        <p className="mt-4">Test: test@gmail.com / 123456</p>
        <p>Admin: admin@gmail.com / admin123</p>
      </form>
    </div>
  )
}