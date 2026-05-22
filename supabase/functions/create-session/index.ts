import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { eventCode, name, company, designation, email } = await req.json()

    // 1. Find active event
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('id')
      .eq('event_code', eventCode)
      .eq('is_active', true)
      .single()

    if (eventError || !event) {
      return new Response(JSON.stringify({ error: 'Event not found or inactive' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // 2. Check if user already exists (by email or username+company)
    let user = null;

    if (email) {
      const { data: existingUserByEmail, error: emailError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('event_id', event.id)
        .eq('email', email)
        .maybeSingle();
      
      if (emailError) throw emailError;
      if (existingUserByEmail) {
        user = existingUserByEmail;
      }
    }

    if (!user && name && company) {
      const { data: existingUserByNameComp, error: nameError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('event_id', event.id)
        .eq('username', name)
        .eq('company', company)
        .maybeSingle();

      if (nameError) throw nameError;
      if (existingUserByNameComp) {
        user = existingUserByNameComp;
      }
    }

    if (user) {
      console.log('Reusing existing user:', user.id)
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabaseClient
        .from('users')
        .insert({
          event_id: event.id,
          username: name,
          company,
          designation,
          email,
          status: 'manual'
        })
        .select()
        .single()

      if (userError) throw userError
      user = newUser
      console.log('Created new user:', user.id)
    }

    // 3. Fetch all active questions for the event
    const { data: allQuestions, error: qError } = await supabaseClient
      .from('questions')
      .select('id')
      .eq('event_id', event.id)
      .eq('is_active', true)

    if (qError) throw qError
    if (!allQuestions || allQuestions.length < 5) {
      throw new Error(`Not enough active questions found for the event (found ${allQuestions?.length ?? 0}, need at least 5)`)
    }

    // Pick 5 random unique questions
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random())
    const selectedQuestionIds = shuffled.slice(0, 5).map(q => q.id)

    // 4. Create game session
    const { data: session, error: sessionError } = await supabaseClient
      .from('game_sessions')
      .insert({
        event_id: event.id,
        user_id: user.id,
        selected_questions: selectedQuestionIds,
        current_question_index: 0,
        total_questions: selectedQuestionIds.length,
        status: 'in_progress'
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // 5. Fetch all question details for pre-fetching (Speed Optimization)
    const { data: questions, error: questionsError } = await supabaseClient
      .from('questions')
      .select('id, category, title, scenario')
      .in('id', selectedQuestionIds)

    if (questionsError) throw questionsError

    // Fetch options for all these questions
    const { data: allOptions, error: optionsError } = await supabaseClient
      .from('question_options')
      .select('question_id, option_key, option_text')
      .in('question_id', selectedQuestionIds)

    if (optionsError) throw optionsError

    // Map options to questions
    const questionsWithDetails = selectedQuestionIds.map(id => {
      const q = questions.find(q => q.id === id)
      return {
        ...q,
        options: allOptions.filter(opt => opt.question_id === id)
      }
    })

    return new Response(JSON.stringify({
      userId: user.id,
      sessionId: session.id,
      questions: questionsWithDetails
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
