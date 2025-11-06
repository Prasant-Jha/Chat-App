import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Requests() {
	const [requests, setRequests] = useState([])
	const [loading, setLoading] = useState(true)

	const load = () => {
		api.get('/friends/incoming').then(({ data }) => setRequests(data.requests || [])).finally(()=>setLoading(false))
	}
	useEffect(() => { load() }, [])

	const respond = async (requestId, action) => {
		await api.post('/friends/respond', { requestId, action })
		load()
	}

	if (loading) return <div className="p-4">Loading...</div>
	return (
		<div className="p-4 max-w-2xl mx-auto">
			<h1 className="text-2xl font-semibold mb-4">Incoming Requests</h1>
			{requests.length === 0 ? (
				<div className="text-gray-500">No pending requests</div>
			) : (
				<div className="space-y-2">
					{requests.map(r => (
						<div key={r._id} className="flex items-center justify-between border rounded p-3">
							<div>
								<div className="font-medium">{r.requester?.name}</div>
								<div className="text-sm text-gray-500">{r.requester?.email}</div>
							</div>
							<div className="flex gap-2">
								<button onClick={() => respond(r._id, 'accept')} className="bg-green-600 text-white px-3 py-1 rounded">Accept</button>
								<button onClick={() => respond(r._id, 'reject')} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
