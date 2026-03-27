import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import { ToastProvider } from './components/ui/ToastProvider'
import Home from './pages/Home'
import ModelLab from './pages/ModelLab'
import WhatIf from './pages/WhatIf'

export default function App() {
  return (
    <ToastProvider>
      <div className="app-shell min-h-screen text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-8rem] h-80 w-80 rounded-full bg-sky-500/[0.18] blur-3xl" />
          <div className="absolute right-[-8%] top-[8rem] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-[-10rem] left-[18%] h-96 w-96 rounded-full bg-blue-700/[0.12] blur-3xl" />
        </div>
        <Navbar />
        <main className="animate-page-enter relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/model-lab" element={<ModelLab />} />
            <Route path="/what-if" element={<WhatIf />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  )
}
