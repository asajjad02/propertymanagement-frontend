import type { Role } from '@/types/api';

/**
 * The landing route for a role — where "/" and post-login send the user, so each
 * role lands somewhere it can actually use (a guard sees only Visitors, so
 * sending them to /flats would be a dead end).
 */
export function homeForRole(role: Role | null): string {
  switch (role) {
    case 'security':
      return '/visitors';
    case 'accountant':
      return '/billing';
    case 'admin':
    case 'manager':
      return '/dashboard';
    default:
      return '/flats';
  }
}
