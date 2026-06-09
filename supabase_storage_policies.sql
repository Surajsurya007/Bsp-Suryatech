-- =========================================================================
--             SUPABASE STORAGE ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
-- Target Bucket: 'app-files'
-- Target Table: storage.objects
-- Description: Enables authenticated users to view, upload, update, and
--              delete files in their own folder (under client user uuid).
-- =========================================================================

-- 1. VIEW POLICY: Users can view own files
create policy "Users can view own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

-- 2. UPLOAD POLICY: Users can upload to own folder
create policy "Users can upload to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

-- 3. UPDATE POLICY: Users can update own files
create policy "Users can update own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

-- 4. DELETE POLICY: Users can delete own files
create policy "Users can delete own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);
