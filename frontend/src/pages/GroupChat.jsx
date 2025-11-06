import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useSocket } from '../context/SocketProvider'

export default function GroupChat() {
	const { groupId } = useParams()
	const { socket } = useSocket()
	const me = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), [])
	const [group, setGroup] = useState(null)
	const [messages, setMessages] = useState([])
	const [text, setText] = useState('')
	const [memberEmail, setMemberEmail] = useState('')
	const [updating, setUpdating] = useState(false)

	useEffect(() => {
		api.get(`/messages/group/${groupId}`).then(({ data }) => setMessages(data.messages || []))
		// naive load of group meta
		api.get('/groups/mine').then(({ data }) => {
			setGroup((data.groups || []).find(g => g._id === groupId) || null)
		})
	}, [groupId])

	useEffect(() => {
		if (!socket) return
		socket.emit('group:join', { groupId })
		const onGroupMessage = ({ message }) => {
			if (message.group === groupId || message.group?._id === groupId) {
				setMessages(m => [...m, message])
			}
		}
		socket.on('group:message', onGroupMessage)
		return () => {
			socket.off('group:message', onGroupMessage)
		}
	}, [socket, groupId])

	const send = () => {
		if (!text.trim() || !socket) return
		socket.emit('group:message', { groupId, content: text, clientId: `${Date.now()}` })
		setText('')
	}

	const reloadGroup = async () => {
		const { data } = await api.get('/groups/mine')
		setGroup((data.groups || []).find(g => g._id === groupId) || null)
	}

	const addMember = async (e) => {
		e.preventDefault()
		if (!memberEmail.trim()) return
		setUpdating(true)
		try {
			const users = await api.get('/users/list')
			const found = users.data.users.find(u => u.email === memberEmail.trim())
			if (!found) return
			await api.post('/groups/add', { groupId, userId: found._id })
			setMemberEmail('')
			reloadGroup()
		} finally {
			setUpdating(false)
		}
	}

	const removeMember = async (userId) => {
		setUpdating(true)
		try {
			await api.post('/groups/remove', { groupId, userId })
			reloadGroup()
		} finally {
			setUpdating(false)
		}
	}

	return (
		<div className="flex h-[calc(100vh-56px)] flex-col">
			<div className="border-b p-3 flex items-center justify-between">
				<div className="font-semibold">{group? group.name : 'Group'}</div>
				{group && group.creator === me.id && (
					<form onSubmit={addMember} className="flex items-center gap-2">
						<input value={memberEmail} onChange={(e)=>setMemberEmail(e.target.value)} placeholder="Add by email" className="border rounded p-1 text-sm" />
						<button disabled={updating} className="text-sm bg-blue-600 disabled:bg-gray-400 text-white px-2 py-1 rounded">Add</button>
					</form>
				)}
			</div>
			<div className="flex-1 p-3 overflow-y-auto space-y-2">
				{messages.map(m => (
					<div key={m._id} className={`max-w-[70%] p-2 rounded ${m.sender===me.id || m.sender?._id===me.id? 'bg-blue-100 ml-auto':'bg-gray-100'}`}>
						{m.content}
					</div>
				))}
				{group && (
					<div className="mt-4">
						<div className="text-sm font-medium mb-2">Members</div>
						<div className="flex flex-wrap gap-2">
							{group.members?.map(m => (
								<div key={m._id || m} className="flex items-center gap-2 border rounded px-2 py-1 text-sm">
									<span>{m.name || m}</span>
									{group.creator === me.id && (m._id || m) !== me.id && (
										<button disabled={updating} onClick={()=>removeMember(m._id || m)} className="text-red-600">Remove</button>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
			<div className="p-3 flex gap-2">
				<input value={text} onChange={(e)=>setText(e.target.value)} className="flex-1 border rounded p-2" placeholder="Type a message" />
				<button onClick={send} className="bg-blue-600 text-white px-4 rounded">Send</button>
			</div>
		</div>
	)
}


