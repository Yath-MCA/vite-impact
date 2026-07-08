import { describe, it, expect } from 'vitest';
import { hasMenuPermission, filterMenuItemsByPermission } from '../../../src/features/dashboard/utils/menuPermissions.js';

describe('menuPermissions', () => {
  it('requires admin for manage_config permission', () => {
    expect(hasMenuPermission(['manage_config'], { isAuthenticated: true, isAdmin: false })).toBe(false);
    expect(hasMenuPermission(['manage_config'], { isAuthenticated: true, isAdmin: true })).toBe(true);
  });

  it('allows read permission for authenticated non-admin users', () => {
    expect(hasMenuPermission(['read'], { isAuthenticated: true, isAdmin: false })).toBe(true);
    expect(hasMenuPermission(['read'], { isAuthenticated: false, isAdmin: false })).toBe(false);
  });

  it('filters nested menu items by permission', () => {
    const items = filterMenuItemsByPermission(
      [
        {
          id: 'configuration',
          permissions: ['manage_config'],
          subItems: [{ label: 'Clients', permissions: ['manage_config'] }]
        },
        {
          id: 'overview',
          permissions: ['read']
        }
      ],
      { isAuthenticated: true, isAdmin: false }
    );

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('overview');
  });
});
