import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export function requireAdminRequest(request: Request): Response | null {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    jwt.verify(authHeader.slice('Bearer '.length), JWT_SECRET)
    return null
  } catch {
    return Response.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
  }
}
