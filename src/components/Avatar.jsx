import { useState } from 'react'

function Avatar({ src, name, className = '' }) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div
        className={`rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 shrink-0 ${className}`}
      >
        {name ? name.charAt(0).toUpperCase() : '?'}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name || 'Avatar'}
      onError={() => setHasError(true)}
      className={`rounded-full object-cover shrink-0 ${className}`}
    />
  )
}

export default Avatar
