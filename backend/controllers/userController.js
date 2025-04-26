const supabase = require('../config/supabase');
const { validationResult } = require('express-validator');

/**
 * Create a new user profile after registration
 * @route POST /api/users/profile
 * @access Private
 */
const createUserProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id, email, first_name, last_name } = req.body;

    // Verify the user ID matches the authenticated user
    if (id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists' });
    }

    // Create a new profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .insert([
        { 
          id, 
          email, 
          first_name: first_name || '', 
          last_name: last_name || '',
          role: 'customer' // Default role
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      return res.status(500).json({ message: 'Failed to create profile' });
    }

    res.status(201).json(profile);
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get authenticated user's profile
 * @route GET /api/users/profile
 * @access Private
 */
const getUserProfile = async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name } = req.body;

    // Update profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update({ 
        first_name: first_name || '',
        last_name: last_name || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ message: 'Failed to update profile' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createUserProfile,
  getUserProfile,
  updateUserProfile
}; 