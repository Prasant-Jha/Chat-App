import Navbar from './Navbar';

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-1">{children}</div>
    </div>
  );
}


