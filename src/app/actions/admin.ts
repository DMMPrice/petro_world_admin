'use server';
// Admin user management is now handled via the REST API from the client (data-context).
// This file is kept as a stub for compatibility.
export async function inviteAdminAction(_email: string, _name: string) {
  return { success: true };
}
