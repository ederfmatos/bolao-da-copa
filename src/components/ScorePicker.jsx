function ScorePicker({ homeScore, awayScore, onChange, disabled }) {
  const handleHomeIncrement = () => {
    if (!disabled) onChange(homeScore + 1, awayScore)
  }

  const handleHomeDecrement = () => {
    if (!disabled && homeScore > 0) onChange(homeScore - 1, awayScore)
  }

  const handleAwayIncrement = () => {
    if (!disabled) onChange(homeScore, awayScore + 1)
  }

  const handleAwayDecrement = () => {
    if (!disabled && awayScore > 0) onChange(homeScore, awayScore - 1)
  }

  const buttonStyle = {
    width: '40px',
    height: '40px',
    fontSize: '1.5rem',
    border: '1px solid #ddd',
    backgroundColor: disabled ? '#f5f5f5' : 'white',
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: '4px',
  }

  const scoreStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    minWidth: '60px',
    textAlign: 'center',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={handleHomeDecrement} style={buttonStyle} disabled={disabled}>
          −
        </button>
        <div style={scoreStyle}>{homeScore}</div>
        <button onClick={handleHomeIncrement} style={buttonStyle} disabled={disabled}>
          +
        </button>
      </div>

      <div style={{ fontSize: '1.5rem', color: '#999' }}>×</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={handleAwayDecrement} style={buttonStyle} disabled={disabled}>
          −
        </button>
        <div style={scoreStyle}>{awayScore}</div>
        <button onClick={handleAwayIncrement} style={buttonStyle} disabled={disabled}>
          +
        </button>
      </div>
    </div>
  )
}

export default ScorePicker
