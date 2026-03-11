import { useMemo } from 'react';
import {
  CLIENTS,
  DEFAULT_CLIENT_ID,
  DEFAULT_ROLE,
  ROLE_PERMISSIONS
} from '../config/clientConfig';

const APP_RBAC = {
  Admin: { dashboard: true, editor: true, reports: true, admin: true },
  Editor: { dashboard: true, editor: true, reports: true, admin: false },
  Production: { dashboard: true, editor: true, reports: true, admin: false },
  Author: { dashboard: false, editor: true, reports: false, admin: false },
  Client: { dashboard: true, editor: false, reports: true, admin: false }
};

export function usePermissions({ userRole, clientId }) {
  const role = userRole || DEFAULT_ROLE;
  const client = CLIENTS[clientId] || CLIENTS[DEFAULT_CLIENT_ID];
  const rolePermissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[DEFAULT_ROLE];

  const permissions = useMemo(() => {
    const featureSet = new Set(client.enabledFeatures);
    const merged = {};

    Object.keys(rolePermissions).forEach((key) => {
      merged[key] = Boolean(rolePermissions[key] && (featureSet.has(key) || !['download', 'proofPDF', 'ceTrack', 'generateTrack', 'comments', 'queries', 'thumbnails'].includes(key)));
    });

    return merged;
  }, [client.enabledFeatures, rolePermissions]);

  const access = APP_RBAC[role] || APP_RBAC[DEFAULT_ROLE] || APP_RBAC.Editor;

  return {
    role,
    client,
    permissions,
    access,
    can: (feature) => Boolean(permissions[feature]),
    canAccess: (area) => Boolean(access[area])
  };
}
