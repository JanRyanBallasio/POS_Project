const { supabase } = require('../config/db');

class RefreshToken {
  static async create(token, userId, expiresAt) {
    const { data, error } = await supabase
      .from('RefreshTokens')
      .insert([{ token, user_id: userId, expires_at: expiresAt }])
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  static async findByToken(token) {
    const { data, error } = await supabase
      .from('RefreshTokens')
      .select('*')
      .eq('token', token)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async deleteByToken(token) {
    const { error } = await supabase
      .from('RefreshTokens')
      .delete()
      .eq('token', token);
    
    if (error) throw error;
  }

  static async deleteExpired() {
    const { error } = await supabase
      .from('RefreshTokens')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    if (error) throw error;
  }

  static async deleteByUserId(userId) {
    const { error } = await supabase
      .from('RefreshTokens')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
  }
}

module.exports = RefreshToken;