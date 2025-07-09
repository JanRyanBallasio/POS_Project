async function testFetch() {
  try {
    const response = await fetch('https://jhnctgttwtuavsfpqlaz.supabase.co');
    console.log('Status:', response.status);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testFetch();