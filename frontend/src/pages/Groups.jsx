import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Groups() {
	const [groups, setGroups] = useState([])
	const [name, setName] = useState('')
	const [memberEmail, setMemberEmail] = useState('')
	const [creating, setCreating] = useState(false)

	const load = async () => {
		const { data } = await api.get('/groups/mine')
		setGroups(data.groups || [])
	}

	useEffect(() => { load() }, [])

	const createGroup = async (e) => {
		e.preventDefault()
		setCreating(true)
		let memberIds = []
		if (memberEmail) {
			// naive: find user by email to add as member (could be improved with search UI)
			const users = await api.get('/users/list')
			const found = users.data.users.find(u => u.email === memberEmail)
			if (found) memberIds = [found._id]
		}
		await api.post('/groups', { name, memberIds })
		setName(''); setMemberEmail(''); setCreating(false)
		load()
	}

	return (
		<div className="p-4 max-w-2xl mx-auto">
			<h1 className="text-2xl font-semibold mb-4">Groups</h1>
			<form onSubmit={createGroup} className="border rounded p-3 mb-4 space-y-2">
				<div className="font-medium">Create Group</div>
				<input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Group name" className="w-full border rounded p-2" />
				<input value={memberEmail} onChange={(e)=>setMemberEmail(e.target.value)} placeholder="Add member by email (optional)" className="w-full border rounded p-2" />
				<button disabled={creating} className="bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded">Create</button>
			</form>
			<div className="space-y-2">
				{groups.map(g => (
					<a key={g._id} href={`/groups/${g._id}`} className="block border rounded p-3 hover:bg-gray-50">
						<div className="font-medium">{g.name}</div>
						<div className="text-sm text-gray-500">Members: {g.members?.length ?? 0}</div>
					</a>
				))}
			</div>
		</div>
	)
}


