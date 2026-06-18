-- Bolão Copa 2026 - Migration 0024
-- Adds 50 more World Cup 2026 top scorer candidates to scorer_players

INSERT INTO scorer_players (name, nationality, flag, position, goals, football_data_id, api_sports_id) VALUES
  -- Argentina
  ('Lionel Messi',          'Argentina',      '🇦🇷', 'Forward',    0, NULL, NULL),
  ('Ángel Di María',        'Argentina',      '🇦🇷', 'Forward',    0, NULL, NULL),
  ('Rodrigo De Paul',       'Argentina',      '🇦🇷', 'Midfielder', 0, NULL, NULL),
  ('Enzo Fernández',        'Argentina',      '🇦🇷', 'Midfielder', 0, NULL, NULL),
  ('Alexis Mac Allister',   'Argentina',      '🇦🇷', 'Midfielder', 0, NULL, NULL),
  ('Paulo Dybala',          'Argentina',      '🇦🇷', 'Forward',    0, NULL, NULL),
  -- Brasil
  ('Rodrygo',               'Brasil',         '🇧🇷', 'Forward',    0, NULL, NULL),
  ('Raphinha',              'Brasil',         '🇧🇷', 'Forward',    0, NULL, NULL),
  ('Lucas Paquetá',         'Brasil',         '🇧🇷', 'Midfielder', 0, NULL, NULL),
  ('Gabriel Martinelli',    'Brasil',         '🇧🇷', 'Forward',    0, NULL, NULL),
  -- França
  ('Antoine Griezmann',     'França',         '🇫🇷', 'Forward',    0, NULL, NULL),
  ('Ousmane Dembélé',       'França',         '🇫🇷', 'Forward',    0, NULL, NULL),
  ('Marcus Thuram',         'França',         '🇫🇷', 'Forward',    0, NULL, NULL),
  ('Randal Kolo Muani',     'França',         '🇫🇷', 'Forward',    0, NULL, NULL),
  -- Inglaterra
  ('Jude Bellingham',       'Inglaterra',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Midfielder', 0, NULL, NULL),
  ('Bukayo Saka',           'Inglaterra',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Forward',    0, NULL, NULL),
  ('Marcus Rashford',       'Inglaterra',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Forward',    0, NULL, NULL),
  ('Cole Palmer',           'Inglaterra',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Midfielder', 0, NULL, NULL),
  ('Declan Rice',           'Inglaterra',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Midfielder', 0, NULL, NULL),
  -- Alemanha
  ('Leroy Sané',            'Alemanha',       '🇩🇪', 'Forward',    0, NULL, NULL),
  ('Niclas Füllkrug',       'Alemanha',       '🇩🇪', 'Forward',    0, NULL, NULL),
  -- Espanha
  ('Dani Olmo',             'Espanha',        '🇪🇸', 'Midfielder', 0, NULL, NULL),
  ('Ferran Torres',         'Espanha',        '🇪🇸', 'Forward',    0, NULL, NULL),
  ('Nico Williams',         'Espanha',        '🇪🇸', 'Forward',    0, NULL, NULL),
  ('Álvaro Morata',         'Espanha',        '🇪🇸', 'Forward',    0, NULL, NULL),
  ('Mikel Oyarzabal',       'Espanha',        '🇪🇸', 'Forward',    0, NULL, NULL),
  -- Portugal
  ('Bruno Fernandes',       'Portugal',       '🇵🇹', 'Midfielder', 0, NULL, NULL),
  ('Bernardo Silva',        'Portugal',       '🇵🇹', 'Midfielder', 0, NULL, NULL),
  ('João Félix',            'Portugal',       '🇵🇹', 'Forward',    0, NULL, NULL),
  ('Pedro Neto',            'Portugal',       '🇵🇹', 'Forward',    0, NULL, NULL),
  -- Colômbia
  ('James Rodríguez',       'Colômbia',       '🇨🇴', 'Midfielder', 0, NULL, NULL),
  -- Equador
  ('Enner Valencia',        'Equador',        '🇪🇨', 'Forward',    0, NULL, NULL),
  ('Kendry Páez',           'Equador',        '🇪🇨', 'Midfielder', 0, NULL, NULL),
  -- Coreia do Sul
  ('Son Heung-min',         'Coreia do Sul',  '🇰🇷', 'Forward',    0, NULL, NULL),
  -- Egito
  ('Mohamed Salah',         'Egito',          '🇪🇬', 'Forward',    0, NULL, NULL),
  -- Senegal
  ('Sadio Mané',            'Senegal',        '🇸🇳', 'Forward',    0, NULL, NULL),
  ('Ismaïla Sarr',          'Senegal',        '🇸🇳', 'Forward',    0, NULL, NULL),
  -- Marrocos
  ('Youssef En-Nesyri',     'Marrocos',       '🇲🇦', 'Forward',    0, NULL, NULL),
  ('Hakim Ziyech',          'Marrocos',       '🇲🇦', 'Midfielder', 0, NULL, NULL),
  ('Sofiane Boufal',        'Marrocos',       '🇲🇦', 'Forward',    0, NULL, NULL),
  -- Nigéria
  ('Ademola Lookman',       'Nigéria',        '🇳🇬', 'Forward',    0, NULL, NULL),
  -- Croácia
  ('Luka Modrić',           'Croácia',        '🇭🇷', 'Midfielder', 0, NULL, NULL),
  ('Andrej Kramarić',       'Croácia',        '🇭🇷', 'Forward',    0, NULL, NULL),
  -- Sérvia
  ('Dušan Vlahović',        'Sérvia',         '🇷🇸', 'Forward',    0, NULL, NULL),
  ('Aleksandar Mitrović',   'Sérvia',         '🇷🇸', 'Forward',    0, NULL, NULL),
  -- Paraguai
  ('Miguel Almirón',        'Paraguai',       '🇵🇾', 'Midfielder', 0, NULL, NULL),
  -- Venezuela
  ('Yeferson Soteldo',      'Venezuela',      '🇻🇪', 'Forward',    0, NULL, NULL),
  ('Salomón Rondón',        'Venezuela',      '🇻🇪', 'Forward',    0, NULL, NULL),
  -- Arábia Saudita
  ('Salem Al-Dawsari',      'Arábia Saudita', '🇸🇦', 'Forward',    0, NULL, NULL),
  -- Austrália
  ('Mathew Leckie',         'Austrália',      '🇦🇺', 'Forward',    0, NULL, NULL),
  -- Costa do Marfim
  ('Sébastien Haller',      'Costa do Marfim','🇨🇮', 'Forward',    0, NULL, NULL);
