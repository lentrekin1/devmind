import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
}

export class AuthMiddleware {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'dev-secret';
  }

  async authenticate(request: NextRequest): Promise<AuthUser | null> {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      return {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role || 'user',
        permissions: decoded.permissions || [],
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      return null;
    }
  }

  authorize(user: AuthUser, requiredPermission: string): boolean {
    if (user.role === 'admin') return true;
    return user.permissions.includes(requiredPermission);
  }

  generateToken(user: Partial<AuthUser>): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );
  }
}

export function withAuth(requiredPermission?: string) {
  return async (request: NextRequest) => {
    const auth = new AuthMiddleware();
    const user = await auth.authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (requiredPermission && !auth.authorize(user, requiredPermission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Add user to request context
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', user.role);
    
    return response;
  };
}