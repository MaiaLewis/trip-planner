'use client'

export default function StickyNote({ children, creator, className = '' }) {
  const colors = [
    'bg-blue-50 text-blue-800 border-blue-200',
    'bg-green-50 text-green-800 border-green-200',
    'bg-purple-50 text-purple-800 border-purple-200',
    'bg-yellow-50 text-yellow-800 border-yellow-200',
    'bg-pink-50 text-pink-800 border-pink-200',
    'bg-indigo-50 text-indigo-800 border-indigo-200'
  ]
  
  const colorIndex = creator.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  const colorClass = colors[colorIndex]

  return (
    <div 
      className={`p-4 rounded-lg shadow-sm border-2 ${colorClass} ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xs font-medium">{creator}</div>
      </div>
      <div className="text-sm">
        {children}
      </div>
    </div>
  )
} 