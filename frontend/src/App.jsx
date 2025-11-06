import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { SocketProvider } from './context/SocketProvider'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import Splash from './pages/Splash'
import Users from './pages/Users'
import Requests from './pages/Requests'
import Groups from './pages/Groups'
import GroupChat from './pages/GroupChat'
import AppShell from './components/AppShell'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={
          <ProtectedRoute>
            <AppShell>
              <SocketProvider>
                <Chat />
              </SocketProvider>
            </AppShell>
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            <AppShell>
              <Users />
            </AppShell>
          </ProtectedRoute>
        } />
        <Route path="/requests" element={
          <ProtectedRoute>
            <AppShell>
              <Requests />
            </AppShell>
          </ProtectedRoute>
        } />
        <Route path="/groups" element={
          <ProtectedRoute>
            <AppShell>
              <Groups />
            </AppShell>
          </ProtectedRoute>
        } />
        <Route path="/groups/:groupId" element={
          <ProtectedRoute>
            <AppShell>
              <SocketProvider>
                <GroupChat />
              </SocketProvider>
            </AppShell>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
