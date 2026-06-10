function Podium({ top3 }) {
  if (!top3 || top3.length === 0) return null

  const podiumColors = ['#ffd700', '#c0c0c0', '#cd7f32']
  const podiumHeights = ['120px', '100px', '80px']

  const ordered = [top3[1], top3[0], top3[2]].filter(Boolean)
  const positions = [2, 1, 3]

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '1rem',
      }}
    >
      {ordered.map((entry, idx) => (
        <div
          key={entry.user_id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100px',
          }}
        >
          <img
            src={entry.avatar_url || 'https://via.placeholder.com/60'}
            alt={entry.name}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: `3px solid ${podiumColors[positions[idx] - 1]}`,
              marginBottom: '0.5rem',
              objectFit: 'cover',
            }}
          />
          <div style={{ fontWeight: 'bold', fontSize: '0.875rem', textAlign: 'center' }}>
            {entry.name}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4caf50' }}>
            {entry.total_points}
          </div>
          <div
            style={{
              width: '80px',
              height: podiumHeights[positions[idx] - 1],
              backgroundColor: podiumColors[positions[idx] - 1],
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              marginTop: '0.5rem',
            }}
          >
            {positions[idx]}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Podium
