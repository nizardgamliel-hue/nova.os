export const permissions = [
  "invoices.read","invoices.manage","mail.send","contacts.read","contacts.create","contacts.update","contacts.delete","deals.read","deals.create","deals.update","deals.delete",
  "members.read","members.invite","members.update","members.remove","organization.update","billing.manage","security.read","companyProfile.read","companyProfile.update","workspaceConfig.read","workspaceConfig.update","automations.read","automations.create","automations.update","automations.activate","automations.delete",
] as const;
export type Permission = typeof permissions[number];
export type Role = "OWNER"|"ADMIN"|"MANAGER"|"MEMBER"|"VIEWER";

const read: Permission[]=["invoices.read","contacts.read","deals.read","companyProfile.read","workspaceConfig.read","automations.read"];
export const rolePermissions: Record<Role,ReadonlySet<Permission>>={
  VIEWER:new Set(read),
  MEMBER:new Set([...read,"contacts.create","contacts.update","deals.create","deals.update","invoices.manage","mail.send"]),
  MANAGER:new Set([...read,"contacts.create","contacts.update","contacts.delete","deals.create","deals.update","deals.delete","members.read","security.read","automations.create","automations.update","automations.activate","invoices.manage","mail.send"]),
  ADMIN:new Set(permissions.filter(p=>p!=="billing.manage")),
  OWNER:new Set(permissions),
};
export function can(role:Role,permission:Permission){return rolePermissions[role].has(permission)}
