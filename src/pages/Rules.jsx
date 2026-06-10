function Rules() {
  const scenarios = [
    {
      points: 10,
      title: 'Placar Exato',
      description: 'Acertar o placar exato da partida',
      example: 'Palpite: 2×1 | Resultado: 2×1',
      color: '#4caf50',
    },
    {
      points: 7,
      title: 'Vencedor + Saldo de Gols',
      description: 'Acertar o vencedor e a diferença de gols',
      example: 'Palpite: 2×0 | Resultado: 3×1 (ambos +2)',
      color: '#8bc34a',
    },
    {
      points: 7,
      title: 'Empate Correto',
      description: 'Acertar que será empate (placar diferente)',
      example: 'Palpite: 1×1 | Resultado: 2×2',
      color: '#8bc34a',
    },
    {
      points: 3,
      title: 'Vencedor Correto',
      description: 'Acertar apenas o vencedor da partida',
      example: 'Palpite: 1×0 | Resultado: 3×1',
      color: '#ff9800',
    },
    {
      points: 0,
      title: 'Resultado Errado',
      description: 'Errar o vencedor ou o empate',
      example: 'Palpite: 2×0 | Resultado: 0×1',
      color: '#f44336',
    },
  ]

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
        Regras do Bolão
      </h1>

      <div
        style={{
          padding: '1rem',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #ffc107',
        }}
      >
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem', margin: 0 }}>
          ⏰ Prazo para Palpites
        </h2>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
          Os palpites devem ser enviados com pelo menos <strong>1 hora de antecedência</strong> antes do início da partida. Após esse prazo, os palpites são bloqueados automaticamente.
        </p>
      </div>

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Pontuação</h2>

      {scenarios.map((scenario, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${scenario.color}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>{scenario.title}</h3>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: scenario.color,
              }}
            >
              {scenario.points} pts
            </div>
          </div>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
            {scenario.description}
          </p>
          <div
            style={{
              fontSize: '0.875rem',
              backgroundColor: '#f5f5f5',
              padding: '0.5rem',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}
          >
            {scenario.example}
          </div>
        </div>
      ))}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>💡 Dica</h3>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>
          Quanto mais preciso for seu palpite, mais pontos você ganha! Priorize acertar o placar exato para ganhar 10 pontos.
        </p>
      </div>
    </div>
  )
}

export default Rules
