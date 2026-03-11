export const config = {
  type: "journal", // "journal" | "book"
  userRole: "editor", // "viewer" | "editor" | "admin"
};

export const PERMISSIONS = {
  viewer: {
    download: false,
    proofPDF: false,
    ceTrack: false,
    generateTrack: false,
    finalize: false,
  },
  editor: {
    download: true,
    proofPDF: true,
    ceTrack: false,
    generateTrack: true,
    finalize: false,
  },
  admin: {
    download: true,
    proofPDF: true,
    ceTrack: true,
    generateTrack: true,
    finalize: true,
  },
};

export function hasPermission(action) {
  const rolePermissions = PERMISSIONS[config.userRole];
  if (!rolePermissions) return false;
  return !!rolePermissions[action];
}
