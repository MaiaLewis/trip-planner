'use client'

export default function UserTopBar({ name, size = 12 }) {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-yellow-100 text-yellow-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800'
  ]
  
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  const colorClass = colors[colorIndex]

  return (
    <div 
      className={`w-full px-4 py-2 ${colorClass} font-bold`}
      style={{ fontSize: size }}
      title={name}
    >
      {name}
    </div>
  )
} 