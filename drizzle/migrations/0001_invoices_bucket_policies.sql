CREATE POLICY "users read own invoice files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users upload own invoice files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users delete own invoice files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);