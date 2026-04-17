import { verifyAdminToken } from '../lib/auth.js';

export function requireAdmin(request, response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Admin authentication required.' });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = verifyAdminToken(token);

    if (decoded.role !== 'admin') {
      return response.status(403).json({ message: 'Forbidden: admin access only.' });
    }

    request.adminUser = decoded;
    return next();
  } catch {
    return response.status(401).json({ message: 'Invalid or expired admin token.' });
  }
}
