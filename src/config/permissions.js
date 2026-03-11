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
    share: false,
    save: false,
    revisions: false,
    tour: true,
  },
  editor: {
    download: true,
    proofPDF: true,
    ceTrack: false,
    generateTrack: true,
    finalize: false,
    share: true,
    save: true,
    revisions: true,
    tour: true,
  },
  admin: {
    download: true,
    proofPDF: true,
    ceTrack: true,
    generateTrack: true,
    finalize: true,
    share: true,
    save: true,
    revisions: true,
    tour: true,
  },
};

export function hasPermission(action) {
  const rolePermissions = PERMISSIONS[config.userRole];
  if (!rolePermissions) return false;
  return !!rolePermissions[action];
}
