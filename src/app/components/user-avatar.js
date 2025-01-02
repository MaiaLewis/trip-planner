'use client'

export default function UserAvatar({ name, size = 24 }) {
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
  const initial = name[0].toUpperCase()

  return (
    <div 
      className={`inline-flex items-center justify-center rounded-full ${colorClass}`}
      style={{ width: size, height: size, fontSize: size/2 }}
      title={name}
    >
      {initial}
    </div>
  )
} 