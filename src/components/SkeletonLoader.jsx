import React from 'react'

// Props:
//   lines  — number of skeleton lines to render (default 3)
//   height — height of each line in px (default 16)
export default function SkeletonLoader({ lines = 3, height = 16 }) {
  return (
    <div className="skeleton-loader" aria-busy="true" aria-label="Loading…">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{ height }}
        />
      ))}
    </div>
  )
}
