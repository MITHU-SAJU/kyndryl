import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yrpptpgvhsymvplxxhfy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycHB0cGd2aHN5bXZwbHh4aGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NjU5MDYsImV4cCI6MjA5NDE0MTkwNn0.voMpwvOOOmkD_9wm92EuJvDX6CXIrpNTBF1O8P426lc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
  
  if (error) {
    console.error('LEADERBOARD ERROR:', error)
  } else {
    console.log('Leaderboard works! Data:', data)
  }
}

check()
