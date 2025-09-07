const { supabase } = require('../config/db');

class User {
  static async findByUsername(username) {
    const { data, error } = await supabase
      .from('Users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('Users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(userData) {
    const { data, error } = await supabase
      .from('Users')
      .insert([userData])
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePassword(id, hashedPassword) {
    const { data, error } = await supabase
      .from('Users')
      .update({ password: hashedPassword })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = User;