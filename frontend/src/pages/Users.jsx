import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Users() {
	const [users, setUsers] = useState([])
	const [loading, setLoading] = useState(true)
	const [pending, setPending] = useState({})
	const [friends, setFriends] = useState({})

	const load = async () => {
		setLoading(true)
		const [{ data: u }, { data: s }] = await Promise.all([
			api.get('/users/list'),
			api.get('/friends/status')
		])
		setUsers(u.users || [])
		const p = {}
		s.pendingOutgoing?.forEach(id => p[id] = true)
		setPending(p)
		const f = {}
		s.friends?.forEach(id => f[id] = true)
		setFriends(f)
		setLoading(false)
	}

	useEffect(() => { load() }, [])

	const sendRequest = async (id) => {
		await api.post('/friends/request', { recipientId: id })
		load()
	}

	if (loading) return <div className="p-4">Loading...</div>
	return (
		<div className="p-4 max-w-2xl mx-auto">
			<h1 className="text-2xl font-semibold mb-4">Find Friends</h1>
			<div className="space-y-2">
				{users.map(u => {
					const isFriend = !!friends[u._id]
					const isPending = !!pending[u._id]
					return (
						<div key={u._id} className="flex items-center justify-between border rounded p-3">
							<div>
								<div className="font-medium">{u.name}</div>
								<div className="text-sm text-gray-500">{u.email}</div>
							</div>
							{isFriend ? (
								<span className="text-green-700 text-sm">Friends</span>
							) : isPending ? (
								<span className="text-yellow-700 text-sm">Pending</span>
							) : (
								<button onClick={() => sendRequest(u._id)} className="bg-blue-600 text-white px-3 py-1 rounded">Connect</button>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}
