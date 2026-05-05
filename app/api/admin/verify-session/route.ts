import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    return NextResponse.json(
      {
        success: true,
        email: decoded.email,
        full_name: decoded.full_name || null,
        id: decoded.id,
        role: decoded.role,
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }
}
