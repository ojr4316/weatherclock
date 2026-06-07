import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { DevPreview } from './routes/DevPreview'
import { Home } from './routes/Home'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dev" element={<DevPreview />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
