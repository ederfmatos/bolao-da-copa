-- Reset predictions and matches tables, then insert World Cup 2026 data

-- Primeiro apagar todas as predições (por causa do foreign key)
DELETE FROM predictions;

-- Depois apagar todos os jogos
DELETE FROM matches;

-- Inserir jogos da Copa do Mundo 2026
INSERT INTO matches (id, home_team, away_team, home_flag, away_flag, group_name, kickoff_at, status) VALUES

-- Fase de Grupos - Rodada 1
('1',  'México',          'África do Sul',       '🇲🇽', '🇿🇦', 'Grupo A', '2026-06-11T19:00:00Z', 'scheduled'),
('2',  'Coreia do Sul',   'Tchéquia',            '🇰🇷', '🇨🇿', 'Grupo A', '2026-06-12T02:00:00Z', 'scheduled'),
('3',  'Canadá',          'Bósnia e Herzegovina','🇨🇦', '🇧🇦', 'Grupo B', '2026-06-12T19:00:00Z', 'scheduled'),
('4',  'Estados Unidos',  'Paraguai',            '🇺🇸', '🇵🇾', 'Grupo D', '2026-06-13T01:00:00Z', 'scheduled'),
('5',  'Austrália',       'Turquia',             '🇦🇺', '🇹🇷', 'Grupo D', '2026-06-14T04:00:00Z', 'scheduled'),
('6',  'Catar',           'Suíça',               '🇶🇦', '🇨🇭', 'Grupo B', '2026-06-13T19:00:00Z', 'scheduled'),
('7',  'Brasil',          'Marrocos',            '🇧🇷', '🇲🇦', 'Grupo C', '2026-06-13T22:00:00Z', 'scheduled'),
('8',  'Haiti',           'Escócia',             '🇭🇹', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Grupo C', '2026-06-14T01:00:00Z', 'scheduled'),
('9',  'Alemanha',        'Curaçao',             '🇩🇪', '🇨🇼', 'Grupo E', '2026-06-14T17:00:00Z', 'scheduled'),
('10', 'Países Baixos',   'Japão',               '🇳🇱', '🇯🇵', 'Grupo F', '2026-06-14T20:00:00Z', 'scheduled'),
('11', 'Costa do Marfim', 'Equador',             '🇨🇮', '🇪🇨', 'Grupo E', '2026-06-14T23:00:00Z', 'scheduled'),
('12', 'Suécia',          'Tunísia',             '🇸🇪', '🇹🇳', 'Grupo F', '2026-06-15T02:00:00Z', 'scheduled'),
('13', 'Espanha',         'Cabo Verde',          '🇪🇸', '🇨🇻', 'Grupo H', '2026-06-15T17:00:00Z', 'scheduled'),
('14', 'Bélgica',         'Egito',               '🇧🇪', '🇪🇬', 'Grupo G', '2026-06-15T22:00:00Z', 'scheduled'),
('15', 'Arábia Saudita',  'Uruguai',             '🇸🇦', '🇺🇾', 'Grupo H', '2026-06-15T22:00:00Z', 'scheduled'),
('16', 'Irã',             'Nova Zelândia',       '🇮🇷', '🇳🇿', 'Grupo G', '2026-06-16T04:00:00Z', 'scheduled'),
('17', 'França',          'Senegal',             '🇫🇷', '🇸🇳', 'Grupo I', '2026-06-16T19:00:00Z', 'scheduled'),
('18', 'Iraque',          'Noruega',             '🇮🇶', '🇳🇴', 'Grupo I', '2026-06-16T22:00:00Z', 'scheduled'),
('19', 'Argentina',       'Argélia',             '🇦🇷', '🇩🇿', 'Grupo J', '2026-06-17T01:00:00Z', 'scheduled'),
('20', 'Áustria',         'Jordânia',            '🇦🇹', '🇯🇴', 'Grupo J', '2026-06-17T04:00:00Z', 'scheduled'),
('21', 'Portugal',        'RD Congo',            '🇵🇹', '🇨🇩', 'Grupo K', '2026-06-17T17:00:00Z', 'scheduled'),
('22', 'Inglaterra',      'Croácia',             '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇭🇷', 'Grupo L', '2026-06-17T20:00:00Z', 'scheduled'),
('23', 'Gana',            'Panamá',              '🇬🇭', '🇵🇦', 'Grupo L', '2026-06-17T23:00:00Z', 'scheduled'),
('24', 'Uzbequistão',     'Colômbia',            '🇺🇿', '🇨🇴', 'Grupo K', '2026-06-18T02:00:00Z', 'scheduled'),

-- Fase de Grupos - Rodada 2
('25', 'Tchéquia',             'África do Sul',      '🇨🇿', '🇿🇦', 'Grupo A', '2026-06-18T16:00:00Z', 'scheduled'),
('26', 'Suíça',                'Bósnia e Herzegovina','🇨🇭', '🇧🇦', 'Grupo B', '2026-06-18T19:00:00Z', 'scheduled'),
('27', 'Canadá',               'Catar',              '🇨🇦', '🇶🇦', 'Grupo B', '2026-06-18T22:00:00Z', 'scheduled'),
('28', 'México',               'Coreia do Sul',      '🇲🇽', '🇰🇷', 'Grupo A', '2026-06-19T03:00:00Z', 'scheduled'),
('29', 'Estados Unidos',       'Austrália',          '🇺🇸', '🇦🇺', 'Grupo D', '2026-06-19T19:00:00Z', 'scheduled'),
('30', 'Escócia',              'Marrocos',           '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🇲🇦', 'Grupo C', '2026-06-19T22:00:00Z', 'scheduled'),
('31', 'Brasil',               'Haiti',              '🇧🇷', '🇭🇹', 'Grupo C', '2026-06-20T01:00:00Z', 'scheduled'),
('32', 'Turquia',              'Paraguai',           '🇹🇷', '🇵🇾', 'Grupo D', '2026-06-20T04:00:00Z', 'scheduled'),
('33', 'Países Baixos',        'Suécia',             '🇳🇱', '🇸🇪', 'Grupo F', '2026-06-20T17:00:00Z', 'scheduled'),
('34', 'Alemanha',             'Costa do Marfim',    '🇩🇪', '🇨🇮', 'Grupo E', '2026-06-20T20:00:00Z', 'scheduled'),
('35', 'Equador',              'Curaçao',            '🇪🇨', '🇨🇼', 'Grupo E', '2026-06-21T00:00:00Z', 'scheduled'),
('36', 'Tunísia',              'Japão',              '🇹🇳', '🇯🇵', 'Grupo F', '2026-06-21T04:00:00Z', 'scheduled'),
('37', 'Espanha',              'Arábia Saudita',     '🇪🇸', '🇸🇦', 'Grupo H', '2026-06-21T16:00:00Z', 'scheduled'),
('38', 'Bélgica',              'Irã',                '🇧🇪', '🇮🇷', 'Grupo G', '2026-06-21T19:00:00Z', 'scheduled'),
('39', 'Uruguai',              'Cabo Verde',         '🇺🇾', '🇨🇻', 'Grupo H', '2026-06-21T22:00:00Z', 'scheduled'),
('40', 'Nova Zelândia',        'Egito',              '🇳🇿', '🇪🇬', 'Grupo G', '2026-06-22T01:00:00Z', 'scheduled'),
('41', 'Argentina',            'Áustria',            '🇦🇷', '🇦🇹', 'Grupo J', '2026-06-22T17:00:00Z', 'scheduled'),
('42', 'França',               'Iraque',             '🇫🇷', '🇮🇶', 'Grupo I', '2026-06-22T21:00:00Z', 'scheduled'),
('43', 'Noruega',              'Senegal',            '🇳🇴', '🇸🇳', 'Grupo I', '2026-06-23T00:00:00Z', 'scheduled'),
('44', 'Jordânia',             'Argélia',            '🇯🇴', '🇩🇿', 'Grupo J', '2026-06-23T03:00:00Z', 'scheduled'),
('45', 'Portugal',             'Uzbequistão',        '🇵🇹', '🇺🇿', 'Grupo K', '2026-06-23T17:00:00Z', 'scheduled'),
('46', 'Inglaterra',           'Gana',               '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇬🇭', 'Grupo L', '2026-06-23T20:00:00Z', 'scheduled'),
('47', 'Panamá',               'Croácia',            '🇵🇦', '🇭🇷', 'Grupo L', '2026-06-23T23:00:00Z', 'scheduled'),
('48', 'Colômbia',             'RD Congo',           '🇨🇴', '🇨🇩', 'Grupo K', '2026-06-24T02:00:00Z', 'scheduled'),

-- Fase de Grupos - Rodada 3
('49', 'Suíça',                'Canadá',             '🇨🇭', '🇨🇦', 'Grupo B', '2026-06-24T19:00:00Z', 'scheduled'),
('50', 'Bósnia e Herzegovina', 'Catar',              '🇧🇦', '🇶🇦', 'Grupo B', '2026-06-24T19:00:00Z', 'scheduled'),
('51', 'Escócia',              'Brasil',             '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🇧🇷', 'Grupo C', '2026-06-24T22:00:00Z', 'scheduled'),
('52', 'Marrocos',             'Haiti',              '🇲🇦', '🇭🇹', 'Grupo C', '2026-06-24T22:00:00Z', 'scheduled'),
('53', 'Tchéquia',             'México',             '🇨🇿', '🇲🇽', 'Grupo A', '2026-06-25T01:00:00Z', 'scheduled'),
('54', 'África do Sul',        'Coreia do Sul',      '🇿🇦', '🇰🇷', 'Grupo A', '2026-06-25T01:00:00Z', 'scheduled'),
('55', 'Equador',              'Alemanha',           '🇪🇨', '🇩🇪', 'Grupo E', '2026-06-25T20:00:00Z', 'scheduled'),
('56', 'Curaçao',              'Costa do Marfim',    '🇨🇼', '🇨🇮', 'Grupo E', '2026-06-25T20:00:00Z', 'scheduled'),
('57', 'Japão',                'Suécia',             '🇯🇵', '🇸🇪', 'Grupo F', '2026-06-25T23:00:00Z', 'scheduled'),
('58', 'Tunísia',              'Países Baixos',      '🇹🇳', '🇳🇱', 'Grupo F', '2026-06-25T23:00:00Z', 'scheduled'),
('59', 'Turquia',              'Estados Unidos',     '🇹🇷', '🇺🇸', 'Grupo D', '2026-06-26T02:00:00Z', 'scheduled'),
('60', 'Paraguai',             'Austrália',          '🇵🇾', '🇦🇺', 'Grupo D', '2026-06-26T02:00:00Z', 'scheduled'),
('61', 'Noruega',              'França',             '🇳🇴', '🇫🇷', 'Grupo I', '2026-06-26T19:00:00Z', 'scheduled'),
('62', 'Senegal',              'Iraque',             '🇸🇳', '🇮🇶', 'Grupo I', '2026-06-26T19:00:00Z', 'scheduled'),
('63', 'Cabo Verde',           'Arábia Saudita',     '🇨🇻', '🇸🇦', 'Grupo H', '2026-06-27T00:00:00Z', 'scheduled'),
('64', 'Uruguai',              'Espanha',            '🇺🇾', '🇪🇸', 'Grupo H', '2026-06-27T00:00:00Z', 'scheduled'),
('65', 'Egito',                'Irã',                '🇪🇬', '🇮🇷', 'Grupo G', '2026-06-27T03:00:00Z', 'scheduled'),
('66', 'Nova Zelândia',        'Bélgica',            '🇳🇿', '🇧🇪', 'Grupo G', '2026-06-27T03:00:00Z', 'scheduled'),
('67', 'Panamá',               'Inglaterra',         '🇵🇦', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Grupo L', '2026-06-27T21:00:00Z', 'scheduled'),
('68', 'Croácia',              'Gana',               '🇭🇷', '🇬🇭', 'Grupo L', '2026-06-27T21:00:00Z', 'scheduled'),
('69', 'Colômbia',             'Portugal',           '🇨🇴', '🇵🇹', 'Grupo K', '2026-06-27T23:30:00Z', 'scheduled'),
('70', 'RD Congo',             'Uzbequistão',        '🇨🇩', '🇺🇿', 'Grupo K', '2026-06-27T23:30:00Z', 'scheduled'),
('71', 'Argélia',              'Áustria',            '🇩🇿', '🇦🇹', 'Grupo J', '2026-06-28T02:00:00Z', 'scheduled'),
('72', 'Jordânia',             'Argentina',          '🇯🇴', '🇦🇷', 'Grupo J', '2026-06-28T02:00:00Z', 'scheduled'),

-- Finais
('103', 'TBD', 'TBD', '🏳️', '🏳️', 'Terceiro Lugar', '2026-07-18T21:00:00Z', 'scheduled'),
('104', 'TBD', 'TBD', '🏳️', '🏳️', 'Final',          '2026-07-19T19:00:00Z', 'scheduled');
