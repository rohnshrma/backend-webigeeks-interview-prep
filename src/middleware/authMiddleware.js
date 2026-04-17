import { User } from '../models/User.js';
import { verifyToken } from '../lib/auth.js';

export async function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.sub);

    if (!user) {
      return response.status(401).json({ message: 'User not found for this token.' });
    }

    request.user = user;
    return next();
  } catch {
    return response.status(401).json({ message: 'Invalid or expired token.' });
  }
}
