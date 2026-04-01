-- postsテーブルに勝負時間・行動フィールドを追加
ALTER TABLE posts ADD COLUMN IF NOT EXISTS action       text        NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS battle_start timestamptz NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS battle_end   timestamptz NULL;

-- action に "go" / "nogo" / null のみ許容
ALTER TABLE posts ADD CONSTRAINT posts_action_check
  CHECK (action IS NULL OR action IN ('go', 'nogo'));
