const { supabase } = require('./supabaseClient');

async function test() {
  const { data, error } = await supabase.from('Users').select('*');
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Data:', data);
  }
}

test();