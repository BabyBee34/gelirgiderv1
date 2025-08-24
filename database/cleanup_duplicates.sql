-- FinanceFlow - Duplicate Categories Cleanup Script
-- Bu script Supabase'deki duplicate kategorileri temizler

-- 1. Duplicate kategorileri bul
WITH duplicates AS (
  SELECT 
    name,
    type,
    user_id,
    COUNT(*) as count,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY id) as all_ids
  FROM categories
  GROUP BY name, type, user_id
  HAVING COUNT(*) > 1
)
SELECT 
  name,
  type,
  user_id,
  count,
  keep_id,
  all_ids
FROM duplicates
ORDER BY name, type;

-- 2. Duplicate kategorileri sil (keep_id hariç)
-- Bu komutu çalıştırmadan önce yukarıdaki sorguyu çalıştırın ve sonuçları kontrol edin

-- WITH duplicates AS (
--   SELECT 
--     name,
--     type,
--     user_id,
--     COUNT(*) as count,
--     MIN(id) as keep_id,
--     ARRAY_AGG(id ORDER BY id) as all_ids
--   FROM categories
--   GROUP BY name, type, user_id
--   HAVING COUNT(*) > 1
-- )
-- DELETE FROM categories 
-- WHERE id IN (
--   SELECT unnest(all_ids[2:]) -- İlk ID'yi (keep_id) hariç tut
--   FROM duplicates
-- );

-- 3. Kategorileri yeniden sırala
-- ALTER TABLE categories ALTER COLUMN id RESTART WITH 1;

-- 4. Kategorileri kontrol et
-- SELECT * FROM categories ORDER BY name, type;
