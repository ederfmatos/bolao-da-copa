-- Seed de partidas da Copa do Mundo 2026
-- Executar no Supabase SQL Editor

INSERT INTO matches (id, home_team, away_team, home_flag, away_flag, group_name, kickoff_at, status, home_score, away_score) VALUES
-- Grupo A
('match_001', 'México', 'África do Sul', '🇲🇽', '🇿🇦', 'Grupo A', '2026-06-11T19:00:00Z', 'scheduled', NULL, NULL),
('match_002', 'Canadá', 'Equador', '🇨🇦', '🇪🇨', 'Grupo A', '2026-06-11T22:00:00Z', 'scheduled', NULL, NULL),
('match_003', 'México', 'Canadá', '🇲🇽', '🇨🇦', 'Grupo A', '2026-06-15T16:00:00Z', 'scheduled', NULL, NULL),
('match_004', 'África do Sul', 'Equador', '🇿🇦', '🇪🇨', 'Grupo A', '2026-06-15T19:00:00Z', 'scheduled', NULL, NULL),
('match_005', 'Equador', 'México', '🇪🇨', '🇲🇽', 'Grupo A', '2026-06-19T22:00:00Z', 'scheduled', NULL, NULL),
('match_006', 'África do Sul', 'Canadá', '🇿🇦', '🇨🇦', 'Grupo A', '2026-06-19T22:00:00Z', 'scheduled', NULL, NULL),

-- Grupo B
('match_007', 'Argentina', 'Arábia Saudita', '🇦🇷', '🇸🇦', 'Grupo B', '2026-06-12T13:00:00Z', 'scheduled', NULL, NULL),
('match_008', 'México', 'Polônia', '🇲🇽', '🇵🇱', 'Grupo B', '2026-06-12T16:00:00Z', 'scheduled', NULL, NULL),
('match_009', 'Argentina', 'México', '🇦🇷', '🇲🇽', 'Grupo B', '2026-06-16T19:00:00Z', 'scheduled', NULL, NULL),
('match_010', 'Polônia', 'Arábia Saudita', '🇵🇱', '🇸🇦', 'Grupo B', '2026-06-16T13:00:00Z', 'scheduled', NULL, NULL),
('match_011', 'Polônia', 'Argentina', '🇵🇱', '🇦🇷', 'Grupo B', '2026-06-20T22:00:00Z', 'scheduled', NULL, NULL),
('match_012', 'Arábia Saudita', 'México', '🇸🇦', '🇲🇽', 'Grupo B', '2026-06-20T22:00:00Z', 'scheduled', NULL, NULL),

-- Grupo C
('match_013', 'Brasil', 'Sérvia', '🇧🇷', '🇷🇸', 'Grupo C', '2026-06-12T19:00:00Z', 'scheduled', NULL, NULL),
('match_014', 'Uruguai', 'Coreia do Sul', '🇺🇾', '🇰🇷', 'Grupo C', '2026-06-12T22:00:00Z', 'scheduled', NULL, NULL),
('match_015', 'Brasil', 'Uruguai', '🇧🇷', '🇺🇾', 'Grupo C', '2026-06-16T22:00:00Z', 'scheduled', NULL, NULL),
('match_016', 'Coreia do Sul', 'Sérvia', '🇰🇷', '🇷🇸', 'Grupo C', '2026-06-16T16:00:00Z', 'scheduled', NULL, NULL),
('match_017', 'Coreia do Sul', 'Brasil', '🇰🇷', '🇧🇷', 'Grupo C', '2026-06-20T19:00:00Z', 'scheduled', NULL, NULL),
('match_018', 'Sérvia', 'Uruguai', '🇷🇸', '🇺🇾', 'Grupo C', '2026-06-20T19:00:00Z', 'scheduled', NULL, NULL),

-- Grupo D
('match_019', 'França', 'Austrália', '🇫🇷', '🇦🇺', 'Grupo D', '2026-06-13T13:00:00Z', 'scheduled', NULL, NULL),
('match_020', 'Dinamarca', 'Tunísia', '🇩🇰', '🇹🇳', 'Grupo D', '2026-06-13T16:00:00Z', 'scheduled', NULL, NULL),
('match_021', 'França', 'Dinamarca', '🇫🇷', '🇩🇰', 'Grupo D', '2026-06-17T19:00:00Z', 'scheduled', NULL, NULL),
('match_022', 'Tunísia', 'Austrália', '🇹🇳', '🇦🇺', 'Grupo D', '2026-06-17T13:00:00Z', 'scheduled', NULL, NULL),
('match_023', 'Tunísia', 'França', '🇹🇳', '🇫🇷', 'Grupo D', '2026-06-21T22:00:00Z', 'scheduled', NULL, NULL),
('match_024', 'Austrália', 'Dinamarca', '🇦🇺', '🇩🇰', 'Grupo D', '2026-06-21T22:00:00Z', 'scheduled', NULL, NULL),

-- Grupo E
('match_025', 'Espanha', 'Costa Rica', '🇪🇸', '🇨🇷', 'Grupo E', '2026-06-13T19:00:00Z', 'scheduled', NULL, NULL),
('match_026', 'Alemanha', 'Japão', '🇩🇪', '🇯🇵', 'Grupo E', '2026-06-13T22:00:00Z', 'scheduled', NULL, NULL),
('match_027', 'Espanha', 'Alemanha', '🇪🇸', '🇩🇪', 'Grupo E', '2026-06-17T22:00:00Z', 'scheduled', NULL, NULL),
('match_028', 'Japão', 'Costa Rica', '🇯🇵', '🇨🇷', 'Grupo E', '2026-06-17T16:00:00Z', 'scheduled', NULL, NULL),
('match_029', 'Japão', 'Espanha', '🇯🇵', '🇪🇸', 'Grupo E', '2026-06-21T19:00:00Z', 'scheduled', NULL, NULL),
('match_030', 'Costa Rica', 'Alemanha', '🇨🇷', '🇩🇪', 'Grupo E', '2026-06-21T19:00:00Z', 'scheduled', NULL, NULL),

-- Grupo F
('match_031', 'Bélgica', 'Canadá', '🇧🇪', '🇨🇦', 'Grupo F', '2026-06-14T13:00:00Z', 'scheduled', NULL, NULL),
('match_032', 'Marrocos', 'Croácia', '🇲🇦', '🇭🇷', 'Grupo F', '2026-06-14T16:00:00Z', 'scheduled', NULL, NULL),
('match_033', 'Bélgica', 'Marrocos', '🇧🇪', '🇲🇦', 'Grupo F', '2026-06-18T13:00:00Z', 'scheduled', NULL, NULL),
('match_034', 'Croácia', 'Canadá', '🇭🇷', '🇨🇦', 'Grupo F', '2026-06-18T16:00:00Z', 'scheduled', NULL, NULL),
('match_035', 'Croácia', 'Bélgica', '🇭🇷', '🇧🇪', 'Grupo F', '2026-06-22T22:00:00Z', 'scheduled', NULL, NULL),
('match_036', 'Canadá', 'Marrocos', '🇨🇦', '🇲🇦', 'Grupo F', '2026-06-22T22:00:00Z', 'scheduled', NULL, NULL),

-- Grupo G
('match_037', 'Portugal', 'Gana', '🇵🇹', '🇬🇭', 'Grupo G', '2026-06-14T19:00:00Z', 'scheduled', NULL, NULL),
('match_038', 'Uruguai', 'Coreia do Sul', '🇺🇾', '🇰🇷', 'Grupo G', '2026-06-14T22:00:00Z', 'scheduled', NULL, NULL),
('match_039', 'Portugal', 'Uruguai', '🇵🇹', '🇺🇾', 'Grupo G', '2026-06-18T19:00:00Z', 'scheduled', NULL, NULL),
('match_040', 'Coreia do Sul', 'Gana', '🇰🇷', '🇬🇭', 'Grupo G', '2026-06-18T22:00:00Z', 'scheduled', NULL, NULL),
('match_041', 'Coreia do Sul', 'Portugal', '🇰🇷', '🇵🇹', 'Grupo G', '2026-06-22T19:00:00Z', 'scheduled', NULL, NULL),
('match_042', 'Gana', 'Uruguai', '🇬🇭', '🇺🇾', 'Grupo G', '2026-06-22T19:00:00Z', 'scheduled', NULL, NULL),

-- Grupo H
('match_043', 'Inglaterra', 'Irã', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇮🇷', 'Grupo H', '2026-06-15T13:00:00Z', 'scheduled', NULL, NULL),
('match_044', 'Senegal', 'Holanda', '🇸🇳', '🇳🇱', 'Grupo H', '2026-06-15T16:00:00Z', 'scheduled', NULL, NULL),
('match_045', 'Inglaterra', 'Senegal', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇸🇳', 'Grupo H', '2026-06-19T13:00:00Z', 'scheduled', NULL, NULL),
('match_046', 'Holanda', 'Irã', '🇳🇱', '🇮🇷', 'Grupo H', '2026-06-19T16:00:00Z', 'scheduled', NULL, NULL),
('match_047', 'Holanda', 'Inglaterra', '🇳🇱', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Grupo H', '2026-06-23T22:00:00Z', 'scheduled', NULL, NULL),
('match_048', 'Irã', 'Senegal', '🇮🇷', '🇸🇳', 'Grupo H', '2026-06-23T22:00:00Z', 'scheduled', NULL, NULL);
