import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://htadelbjzgnrglackutq.supabase.co'
const supabaseKey = 'sb_publisible_150CaBmtYRRl6jpI_aySng_SO4gxu-l'

export const supabase = createClient(supabaseUrl, supabaseKey)
