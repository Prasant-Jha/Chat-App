import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const isActive = (path) => location.pathname === path;
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="w-full border-b bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="font-bold">GutarGu</div>
          <Link className={`text-sm ${isActive('/users')? 'text-blue-600 font-semibold':'text-gray-700'}`} to="/users">Users</Link>
          <Link className={`text-sm ${isActive('/requests')? 'text-blue-600 font-semibold':'text-gray-700'}`} to="/requests">Requests</Link>
          <Link className={`text-sm ${isActive('/chat')? 'text-blue-600 font-semibold':'text-gray-700'}`} to="/chat">Chat</Link>
          <Link className={`text-sm ${isActive('/groups')? 'text-blue-600 font-semibold':'text-gray-700'}`} to="/groups">Groups</Link>
        </div>
        <div className="flex items-center gap-3">
          {user?.name && <div className="text-sm text-gray-600">{user.name}</div>}
          <button onClick={logout} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">Logout</button>
        </div>
      </div>
    </div>
  );
}


