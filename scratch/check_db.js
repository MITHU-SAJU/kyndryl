import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yrpptpgvhsymvplxxhfy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycHB0cGd2aHN5bXZwbHh4aGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NjU5MDYsImV4cCI6MjA5NDE0MTkwNn0.voMpwvOOOmkD_9wm92EuJvDX6CXIrpNTBF1O8P426lc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('*')
  
  console.log('Events in DB:', events)

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
  
  if (userError) {
    console.error('Error fetching users:', userError)
  } else {
    console.log('Users in DB (Count:', users?.length, '):', users?.slice(0, 10))
    const matching = users?.filter(u => u.username?.toLowerCase().includes('aarti') || u.name?.toLowerCase().includes('aarti'))
    console.log('Matching "aarti":', matching)
  }
}

check()
