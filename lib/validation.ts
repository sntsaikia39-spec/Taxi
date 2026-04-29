/**
 * Validation utilities for strict type checking on user inputs
 */

/**
 * Validates email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' }
  }

  const trimmed = email.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email cannot be empty' }
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' }
  }

  // RFC 5322 simplified regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' }
  }

  return { valid: true }
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' }
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' }
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' }
  }

  return { valid: true }
}

/**
 * Validates full name
 */
export function validateFullName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Full name is required' }
  }

  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: 'Full name cannot be empty' }
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'Full name must be at least 2 characters' }
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Full name is too long' }
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: 'Full name can only contain letters, spaces, hyphens, and apostrophes' }
  }

  // Require at least two words
  const words = trimmed.split(/\s+/).filter(word => word.length > 0)
  if (words.length < 2) {
    return { valid: false, error: 'Full name must contain at least two words' }
  }

  return { valid: true }
}

/**
 * Validates phone number (10-digit format for India)
 */
export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' }
  }

  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length !== 10) {
    return { valid: false, error: 'Phone number must be 10 digits' }
  }

  return { valid: true }
}
