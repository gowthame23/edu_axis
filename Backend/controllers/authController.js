import User from '../models/User.js';
import School from '../models/School.js';

const getAuthCookieOptions = (req) => {
  const origin = req?.headers?.origin || '';
  const isLocalOrigin = /localhost|127\.0\.0\.1/i.test(origin);
  const isHttpsOrigin = /^https:\/\//i.test(origin);
  const isProduction = process.env.NODE_ENV === 'production';
  const useCrossSiteCookie = isHttpsOrigin && !isLocalOrigin;

  return {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: useCrossSiteCookie || isProduction ? 'none' : 'lax',
    secure: useCrossSiteCookie || isProduction,
    path: '/'
  };
};

// Helper function to extract domain from email
const extractDomain = (email) => {
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : null;
};

// Helper function to find school by code or email domain
const findSchoolForUser = async (email, schoolCode) => {
  // First try to find by school code if provided
  if (schoolCode) {
    const school = await School.findOne({ 
      code: schoolCode.toUpperCase(),
      status: 'active'
    });
    if (school) return school;
  }

  // Then try to find by email domain
  const domain = extractDomain(email);
  if (domain) {
    const school = await School.findOne({ 
      allowedEmailDomains: domain,
      status: 'active'
    });
    if (school) return school;
  }

  return null;
};

// Register new user
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, dateOfBirth, grade, section, subject, gradesTeaching, schoolId, schoolCode } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email, and password are required' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Public registration is only for students and teachers
    // Admins must be created by super admin or existing school admin
    const effectiveRole = role || 'student';
    
    if (effectiveRole === 'admin' || effectiveRole === 'superadmin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin accounts cannot be created through public registration. Please contact your school administrator.' 
      });
    }
    
    // Determine schoolId for non-superadmin roles
    let finalSchoolId = schoolId;
    
    if (effectiveRole !== 'superadmin') {
      // Try to find school by code or email domain
      const school = await findSchoolForUser(email, schoolCode);
      
      if (!school && !schoolId) {
        return res.status(400).json({ 
          success: false,
          message: 'Could not identify your school. Please provide a valid school code or use your school email domain.' 
        });
      }
      
      // Use found school or provided schoolId
      finalSchoolId = school ? school._id : schoolId;
      
      // Verify school is active
      if (school && school.status !== 'active') {
        return res.status(403).json({ 
          success: false,
          message: `School is currently ${school.status}. Please contact your administrator.` 
        });
      }
    }

    if (effectiveRole === 'student') {
      const validGrades = ['1','2','3','4','5','6','7','8','9','10','11','12'];
      if (!grade || !validGrades.includes(String(grade))) {
        return res.status(400).json({ success: false, message: 'Grade is required and must be between 1-12' });
      }
      const validSections = ['A','B','C','D'];
      if (section && !validSections.includes(String(section))) {
        return res.status(400).json({ success: false, message: 'Section must be A-D when provided' });
      }
    }

    // Prepare payload
    const payload = {
      name,
      email,
      password,
      role: effectiveRole,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    };
    
    // Add schoolId for non-superadmin
    if (effectiveRole !== 'superadmin') {
      payload.schoolId = finalSchoolId;
    }

    if (effectiveRole === 'student') {
      payload.grade = String(grade);
      if (section) payload.section = String(section);
    } else if (effectiveRole === 'teacher') {
      if (subject) payload.subject = subject;
      if (Array.isArray(gradesTeaching)) payload.gradesTeaching = gradesTeaching.map(String);
    }

    // Create new user (password will be hashed by pre-save hook)
    const newUser = await User.create(payload);

    // Generate JWT token
    const token = newUser.generateAuthToken();

    // Use cross-site compatible cookie options in production (Vercel -> Render)
    res.cookie('authToken', token, getAuthCookieOptions(req));

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser.toJSON(),
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(', ') 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error during registration', 
      error: error.message 
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password, role, schoolCode } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // For non-superadmin users, verify school context
    if (user.role !== 'superadmin') {
      // If school code provided, verify it matches user's school
      if (schoolCode) {
        const school = await School.findOne({ 
          _id: user.schoolId,
          code: schoolCode.toUpperCase()
        });
        
        if (!school) {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid school code for this account' 
          });
        }
        
        // Check school status
        if (school.status !== 'active') {
          return res.status(403).json({ 
            success: false,
            message: `School is currently ${school.status}. Please contact your administrator.` 
          });
        }
      } else {
        // No school code provided - verify by email domain
        const school = await School.findById(user.schoolId);
        if (!school || school.status !== 'active') {
          return res.status(403).json({ 
            success: false,
            message: 'Your school account is not active. Please contact administrator.' 
          });
        }
      }
    }

    // Check role matches if provided
    if (role && user.role !== role) {
      return res.status(401).json({ 
        success: false,
        message: `Invalid credentials for ${role} role` 
      });
    }

    // Compare password using bcrypt
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false,
        message: `Account is ${user.status}. Please contact administrator.` 
      });
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    // Use cross-site compatible cookie options in production (Vercel -> Render)
    res.cookie('authToken', token, getAuthCookieOptions(req));

    res.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login', 
      error: error.message 
    });
  }
};

// Logout user
export const logout = async (req, res) => {
  res.clearCookie('authToken', getAuthCookieOptions(req));
  
  res.json({ 
    success: true, 
    message: 'Logout successful' 
  });
};

// Get current user (from JWT token)
export const getCurrentUser = async (req, res) => {
  try {
    // User is already attached by auth middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Current password and new password are required' 
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'New password must be at least 6 characters long' 
      });
    }

    // Get user with password field
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ 
        success: false,
        message: 'New password must be different from current password' 
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during password change', 
      error: error.message 
    });
  }
};
