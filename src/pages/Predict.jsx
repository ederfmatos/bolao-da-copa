import { useParams } from 'react-router-dom'

function Predict() {
  const { matchId } = useParams()
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Palpite</h1>
      <p>Partida: {matchId}</p>
      <p>Formulário de palpite em breve...</p>
    </div>
  )
}

export default Predict
