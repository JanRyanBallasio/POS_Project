require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // Server-side doesn't need session persistence
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'pos-backend/1.0.0'
    }
  }
});

// Add connection health check
const healthCheck = async () => {
  try {
    const { data, error } = await supabase.from('Products').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Database connection healthy');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = { supabase, healthCheck };

module.exports = { supabase };