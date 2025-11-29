import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { userId } = await req.json()

    // Verify user is deleting their own account
    if (user.id !== userId) {
      throw new Error('You can only delete your own account')
    }

    console.log(`Starting account deletion for user: ${userId}`)

    // Delete all user data in correct order (respecting foreign keys)
    // 1. Delete message reactions
    const { error: reactionsError } = await supabaseClient
      .from('message_reactions')
      .delete()
      .eq('user_id', userId)
    
    if (reactionsError) {
      console.error('Error deleting message reactions:', reactionsError)
    }

    // 2. Delete price offers
    const { error: offersError } = await supabaseClient
      .from('price_offers')
      .delete()
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    
    if (offersError) {
      console.error('Error deleting price offers:', offersError)
    }

    // 3. Delete messages
    const { error: messagesError } = await supabaseClient
      .from('messages')
      .delete()
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    
    if (messagesError) {
      console.error('Error deleting messages:', messagesError)
    }

    // 4. Delete conversations
    const { error: conversationsError } = await supabaseClient
      .from('conversations')
      .delete()
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    
    if (conversationsError) {
      console.error('Error deleting conversations:', conversationsError)
    }

    // 5. Delete quick replies
    const { error: quickRepliesError } = await supabaseClient
      .from('quick_replies')
      .delete()
      .eq('user_id', userId)
    
    if (quickRepliesError) {
      console.error('Error deleting quick replies:', quickRepliesError)
    }

    // 6. Delete reviews
    const { error: reviewsError } = await supabaseClient
      .from('reviews')
      .delete()
      .or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`)
    
    if (reviewsError) {
      console.error('Error deleting reviews:', reviewsError)
    }

    // 7. Delete reports
    const { error: reportsError } = await supabaseClient
      .from('reports')
      .delete()
      .eq('reporter_id', userId)
    
    if (reportsError) {
      console.error('Error deleting reports:', reportsError)
    }

    // 8. Delete transactions
    const { error: transactionsError } = await supabaseClient
      .from('transactions')
      .delete()
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    
    if (transactionsError) {
      console.error('Error deleting transactions:', transactionsError)
    }

    // 9. Delete favorites
    const { error: favoritesError } = await supabaseClient
      .from('favorites')
      .delete()
      .eq('user_id', userId)
    
    if (favoritesError) {
      console.error('Error deleting favorites:', favoritesError)
    }

    // 10. Delete followers relationships
    const { error: followersError } = await supabaseClient
      .from('followers')
      .delete()
      .or(`follower_id.eq.${userId},followed_id.eq.${userId}`)
    
    if (followersError) {
      console.error('Error deleting followers:', followersError)
    }

    // 11. Delete blocked users relationships
    const { error: blockedError } = await supabaseClient
      .from('blocked_users')
      .delete()
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
    
    if (blockedError) {
      console.error('Error deleting blocked users:', blockedError)
    }

    // 12. Delete system notifications
    const { error: notificationsError } = await supabaseClient
      .from('system_notifications')
      .delete()
      .eq('user_id', userId)
    
    if (notificationsError) {
      console.error('Error deleting notifications:', notificationsError)
    }

    // 13. Delete listings (must be after favorites, reports, transactions, etc.)
    const { error: listingsError } = await supabaseClient
      .from('listings')
      .delete()
      .eq('user_id', userId)
    
    if (listingsError) {
      console.error('Error deleting listings:', listingsError)
    }

    // 14. Delete user roles
    const { error: rolesError } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
    
    if (rolesError) {
      console.error('Error deleting user roles:', rolesError)
    }

    // 15. Delete profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', userId)
    
    if (profileError) {
      console.error('Error deleting profile:', profileError)
      throw profileError
    }

    // 16. FINALLY - Delete auth user (PERMANENT)
    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(userId)
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      throw authDeleteError
    }

    console.log(`Successfully deleted account for user: ${userId}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Account permanently deleted' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in delete-user-account function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})