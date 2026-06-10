function Podium({ top3 }) {
  if (!top3 || top3.length === 0) return null

  const podiumColors = {
    1: 'bg-yellow-400',
    2: 'bg-gray-300',
    3: 'bg-amber-700',
  }
  const podiumBorders = {
    1: 'border-yellow-400',
    2: 'border-gray-300',
    3: 'border-amber-700',
  }
  const podiumHeights = {
    1: 'h-[120px]',
    2: 'h-[100px]',
    3: 'h-[80px]',
  }

  const ordered = [top3[1], top3[0], top3[2]].filter(Boolean)
  const positions = [2, 1, 3]

  return (
    <div className="flex justify-center items-end gap-4 mb-8 p-4">
      {ordered.map((entry, idx) => (
        <div
          key={entry.user_id}
          className="flex flex-col items-center w-[100px]"
        >
          <img
            src={entry.avatar_url || 'https://via.placeholder.com/60'}
            alt={entry.name}
            className={`w-[60px] h-[60px] rounded-full border-[3px] mb-2 object-cover ${podiumBorders[positions[idx]]}`}
          />
          <div className="font-bold text-sm text-center text-gray-900 dark:text-dark-text leading-tight">
            {entry.name}
          </div>
          <div className="text-xl font-bold text-green-500 dark:text-green-400">
            {entry.total_points}
          </div>
          <div
            className={`w-20 ${podiumHeights[positions[idx]]} ${podiumColors[positions[idx]]} rounded-t-lg flex items-center justify-center text-3xl font-bold text-white mt-2`}
          >
            {positions[idx]}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Podium
