import axios from 'axios'
import { useState, useEffect } from 'react'

export default function AdminPanel() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    axios.get(import.meta.env.VITE_API_URL + '/api/admin/users')
      .then(res => setUsers(res.data))
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>
      <div className="bg-gray-800 p-6 rounded">
        <h2>Total Users: {users.length}</h2>
        <table className="w-full mt-6 text-left">
          <thead>
            <tr className="border-b"><th>Name</th><th>Email</th><th>Balance</th><th>Earned</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-b">
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>৳{u.balance}</td>
                <td>৳{u.totalEarned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}