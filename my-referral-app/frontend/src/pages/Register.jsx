import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', referralCode: '' })
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post(import.meta.env.VITE_API_URL + '/api/register', form)
      alert('Registration successful! Now login')
      navigate('/login')
    } catch (err) {
      alert('Error: ' + (err.response?.data?.msg || 'Try again'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-lg w-96">
        <h2 className="text-2xl mb-6">Register</h2>
        <input className="w-full p-3 border mb-3" placeholder="Name" onChange={e => setForm({...form, name: e.target.value})} required />
        <input className="w-full p-3 border mb-3" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} required />
        <input type="password" className="w-full p-3 border mb-3" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} required />
        <input className="w-full p-3 border mb-4" placeholder="Referral Code (optional)" onChange={e => setForm({...form, referralCode: e.target.value})} />
        <button className="w-full bg-green-600 text-white py-3">Register</button>
      </form>
    </div>
  )
}