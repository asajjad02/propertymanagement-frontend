import type { Role } from './api';

/** A teammate's membership in the current account (GET /api/team/). */
export interface TeamMember {
  id: number;
  username: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

/** Create payload requires username+email+role; PATCH sends role and/or is_active. */
export interface TeamMemberInput {
  username?: string;
  email?: string;
  role?: Role;
  is_active?: boolean;
}
