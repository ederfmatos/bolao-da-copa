import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useAuth } from '../hooks/useAuth'
import LeaderboardRow from '../components/LeaderboardRow'
import Podium from '../components/Podium'

function Leaderboard() {
  const { leaderboard, loading, error } = useLeaderboard()
  const { user } = useAuth()
  const [sharing, setSharing] = useState(false)
  const captureRef = useRef(null)

  const handleShare = async () => {
    if (!captureRef.current) return
    setSharing(true)
    try {
      const el = captureRef.current
      const isDark = document.documentElement.classList.contains('dark')
      const canvas = await html2canvas(el, {
        useCORS: true,
        scale: 2,
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        height: el.scrollHeight,
        width: el.scrollWidth,
        onclone: (_, clonedEl) => {
          const all = clonedEl.querySelectorAll('*')
          for (const n of all) n.style.overflow = 'visible'
        },
      })

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('Falha ao gerar imagem')

      const file = new File([blob], 'classificacao.png', { type: 'image/png' })
      const shareText = 'Confira a classificação do Bolão Copa 2026!'

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: shareText, text: shareText })
      } else if (navigator.share) {
        await navigator.share({ title: shareText, text: shareText, url: window.location.href })
      } else {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + window.location.href)}`
        window.open(url, '_blank', 'noopener')
        const link = document.createElement('a')
        link.href = canvas.toDataURL('image/png')
        link.download = 'classificacao.png'
        link.click()
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share error:', err)
    } finally {
      setSharing(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-dark-muted">Carregando classificação...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Erro: {error}</div>
  }

  if (leaderboard.length === 0) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl mb-4 text-gray-900 dark:text-dark-text">Classificação</h1>
        <p className="text-gray-400 dark:text-dark-muted">Nenhum palpite registrado ainda.</p>
        <p className="text-gray-400 dark:text-dark-muted">Seja o primeiro a palpitar!</p>
      </div>
    )
  }

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="relative mb-4">
        <h1 className="text-2xl text-center text-gray-900 dark:text-dark-text">
          Classificação
        </h1>
        <button
          onClick={handleShare}
          disabled={sharing}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Compartilhar"
        >
          {sharing ? (
            <svg className="animate-spin w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-500 dark:text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          )}
        </button>
      </div>

      <div ref={captureRef}>
        {top3.length === 3 && <Podium top3={top3} />}

        {top3.map((entry, idx) => (
          <LeaderboardRow
            key={entry.user_id}
            entry={entry}
            rank={idx + 1}
            isCurrentUser={entry.user_id === user?.id}
          />
        ))}

        {rest.map((entry, idx) => (
          <LeaderboardRow
            key={entry.user_id}
            entry={entry}
            rank={idx + 4}
            isCurrentUser={entry.user_id === user?.id}
          />
        ))}
      </div>
    </div>
  )
}

export default Leaderboard
