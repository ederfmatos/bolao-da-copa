-- Bolão Copa 2026 - Migration 0025
-- Translate scorer_players.position values to Portuguese

-- Drop existing CHECK constraint
ALTER TABLE scorer_players DROP CONSTRAINT IF EXISTS scorer_players_position_check;

-- Translate values
UPDATE scorer_players SET position = 'Atacante'  WHERE position = 'Forward';
UPDATE scorer_players SET position = 'Meia'      WHERE position = 'Midfielder';
UPDATE scorer_players SET position = 'Defensor'  WHERE position = 'Defender';

-- Re-add CHECK constraint with Portuguese values
ALTER TABLE scorer_players
  ADD CONSTRAINT scorer_players_position_check
  CHECK (position IN ('Atacante', 'Meia', 'Defensor'));
