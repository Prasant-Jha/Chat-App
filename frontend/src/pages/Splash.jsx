import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => {
      const token = localStorage.getItem('token');
      navigate(token ? '/chat' : '/login', { replace: true });
    }, 5000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-5xl font-bold tracking-wide">GutarGu</div>
    </div>
  );
}


