const express = require('express');
const cors = require('cors');
const { supabase } = require('./supabaseClient'); 

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend connected successfully!' });
});

app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('Users').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});