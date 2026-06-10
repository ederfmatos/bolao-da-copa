function LeaderboardRow({ entry, rank, isCurrentUser }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        marginBottom: '0.5rem',
        backgroundColor: isCurrentUser ? '#e3f2fd' : 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: isCurrentUser ? '2px solid #2196f3' : 'none',
      }}
    >
      <div
        style={{
          width: '40px',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: rank <= 3 ? '#ff9800' : '#666',
        }}
      >
        {rank}
      </div>
      
      <img
        src={entry.avatar_url || 'https://via.placeholder.com/40'}
        alt={entry.name}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          marginRight: '1rem',
          objectFit: 'cover',
        }}
      />
      
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>
          {entry.name}
          {isCurrentUser && ' (você)'}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {entry.total_predictions} palpite{entry.total_predictions !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#4caf50',
        }}
      >
        {entry.total_points}
      </div>
    </div>
  )
}

export default LeaderboardRow
