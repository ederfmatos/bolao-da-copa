import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load env
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim().replace(/^"|"$/g, '')))
)

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const WIKI_HEADERS = {
  'User-Agent': 'BolaoCopaBot/1.0 (ederfmatos@gmail.com) fetch-player-photos',
  'Accept': 'application/json',
}

// Fetch photos for a batch of names in a single API call (up to 50)
async function getWikipediaPhotoBatch(names) {
  const titles = names.map(encodeURIComponent).join('|')
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${titles}&prop=pageimages&format=json&pithumbsize=300&redirects=1`
  try {
    const res = await fetch(url, { headers: WIKI_HEADERS })
    const data = await res.json()
    const pages = data.query?.pages ?? {}
    const result = {}
    for (const page of Object.values(pages)) {
      if (page.thumbnail?.source) result[page.title] = page.thumbnail.source
    }
    // Also map via redirects (e.g. "Vinícius Júnior" → normalised title)
    for (const norm of data.query?.normalized ?? []) {
      if (result[norm.to]) result[norm.from] = result[norm.to]
    }
    for (const redir of data.query?.redirects ?? []) {
      if (result[redir.to]) result[redir.from] = result[redir.to]
    }
    return result
  } catch (e) {
    console.error('Wikipedia fetch error:', e.message)
    return {}
  }
}

// Some players need their English Wikipedia name
const NAME_OVERRIDES = {
  'Vinícius Júnior':    'Vinícius Júnior',
  'Kylian Mbappé':      'Kylian Mbappé',
  'Lamine Yamal':       'Lamine Yamal',
  'Rodrygo':            'Rodrygo Goes',
  'Raphinha':           'Raphinha (footballer)',
  'Endrick':            'Endrick (footballer)',
  'Pedri':              'Pedri',
  'Gavi':               'Gavi (footballer)',
  'Nico Williams':      'Nico Williams',
  'Sadio Mané':         'Sadio Mané',
  'Ismaïla Sarr':       'Ismaïla Sarr',
  'Youssef En-Nesyri':  'Youssef En-Nesyri',
  'Hakim Ziyech':       'Hakim Ziyech',
  'Dušan Vlahović':     'Dušan Vlahović',
  'Aleksandar Mitrović':'Aleksandar Mitrović',
  'Ángel Di María':     'Ángel Di María',
  'Julián Álvarez':     'Julián Álvarez',
  'Alexis Mac Allister': 'Alexis Mac Allister',
  'Enzo Fernández':     'Enzo Fernández',
  'Rodrigo De Paul':    'Rodrigo De Paul',
  'Lucas Paquetá':      'Lucas Paquetá',
  'Luka Modrić':        'Luka Modrić',
  'Andrej Kramarić':    'Andrej Kramarić',
  'Miguel Almirón':     'Miguel Almirón',
  'João Félix':         'João Félix',
  'Daichi Kamada':      'Daichi Kamada',
  'Son Heung-min':      'Son Heung-min',
  'Mohamed Salah':      'Mohamed Salah',
  'RD Congo':           null,
}

const BATCH_SIZE = 20
const BATCH_DELAY_MS = 2000

async function main() {
  const { data: players, error } = await supabase
    .from('scorer_players')
    .select('id, name, photo_url')
    .is('photo_url', null)  // only fetch missing ones
    .order('name')

  if (error) { console.error('DB error:', error); process.exit(1) }

  console.log(`Found ${players.length} players without photo\n`)

  let updated = 0, skipped = 0

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = players.slice(i, i + BATCH_SIZE)
    const searchNames = batch.map(p => NAME_OVERRIDES[p.name] ?? p.name)

    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: fetching ${batch.length} players...`)
    const photos = await getWikipediaPhotoBatch(searchNames)

    for (let j = 0; j < batch.length; j++) {
      const player = batch[j]
      const searchName = searchNames[j]
      const photo = photos[searchName]

      if (photo) {
        const { error: upErr } = await supabase
          .from('scorer_players')
          .update({ photo_url: photo })
          .eq('id', player.id)
        if (upErr) {
          console.log(`  ✗ ${player.name}: ${upErr.message}`)
        } else {
          console.log(`  ✓ ${player.name}`)
          updated++
        }
      } else {
        console.log(`  - ${player.name}: no photo found`)
        skipped++
      }
    }

    if (i + BATCH_SIZE < players.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`)
}

main()
