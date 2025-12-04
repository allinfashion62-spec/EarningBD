import axios from 'axios'
import { useState, useEffect } from 'react'

export default function Dashboard({ user }) {
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    axios.get(import.meta.env.VITE_API_URL + '/api/tasks')
      .then(res => setTasks(res.data))
  }, [])

  const completeTask = (taskId, reward) => {
    axios.post(import.meta.env.VITE_API_URL + '/api/complete-task', { userId: user._id, taskId })
      .then(() => {
        alert(`Completed! +${reward} TK added`)
        window.location.reload()
      })
  }

  const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Welcome {user.name}</h1>
        <div className="bg-white p-6 rounded shadow mb-6">
          <p className="text-xl">Balance: ৳{user.balance}</p>
          <p>Total Earned: ৳{user.totalEarned}</p>
          <p className="mt-4 font-bold">Your Referral Link:</p>
          <input className="w-full p-3 border mt-2" value={referralLink} readOnly />
          <button className="mt-2 bg-blue-600 text-white px-4 py-2" onClick={() => navigator.clipboard.writeText(referralLink)}>
            Copy Link
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-4">Daily Tasks</h2>
        <div className="grid gap-4">
          {tasks.map(task => (
            <div key={task._id} className="bg-white p-6 rounded shadow flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{task.title}</h3>
                <p>Reward: ৳{task.reward}</p>
                <a href={task.link} target="_blank" className="text-blue-600">Go →</a>
              </div>
              <button onClick={() => completeTask(task._id, task.reward)} className="bg-green-600 text-white px-6 py-3 rounded">
                Complete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}