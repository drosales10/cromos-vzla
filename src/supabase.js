import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://wldpquyktdnfqerzzpda.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZHBxdXlrdGRuZnFlcnp6cGRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5Mzg2MjgsImV4cCI6MjA5NDUxNDYyOH0.6F8Zwxq3zW-wVKRQCPJSwJjvty46A8IPmsti1DKF4mo'
)
