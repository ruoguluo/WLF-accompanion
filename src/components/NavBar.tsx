import React from 'react'
import { Home as HomeIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  title?: string
}

export default function NavBar({ title }: Props) {
  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HomeIcon className="w-5 h-5 text-blue-600" />
          <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold">Home</Link>
        </div>
        {title && <div className="text-sm text-gray-600 font-medium">{title}</div>}
      </div>
    </header>
  )
}