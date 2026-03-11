export const CLIENTS = {
  PLOS: {
    id: 'PLOS',
    displayName: 'Public Library of Science',
    enabledFeatures: ['download', 'proofPDF', 'comments', 'queries', 'thumbnails']
  },
  OUP: {
    id: 'OUP',
    displayName: 'Oxford University Press',
    enabledFeatures: ['download', 'proofPDF', 'ceTrack', 'comments', 'queries']
  },
  LWW: {
    id: 'LWW',
    displayName: 'Lippincott Williams & Wilkins',
    enabledFeatures: ['download', 'proofPDF', 'generateTrack', 'comments', 'thumbnails']
  },
  Elsevier: {
    id: 'Elsevier',
    displayName: 'Elsevier',
    enabledFeatures: ['download', 'proofPDF', 'ceTrack', 'generateTrack', 'comments', 'queries', 'thumbnails']
  }
};

export const ROLE_PERMISSIONS = {
  Author: {
    download: false,
    proofPDF: false,
    ceTrack: false,
    generateTrack: false,
    finalize: false,
    comments: true,
    queries: true,
    save: true,
    share: false
  },
  Editor: {
    download: true,
    proofPDF: true,
    ceTrack: false,
    generateTrack: true,
    finalize: false,
    comments: true,
    queries: true,
    save: true,
    share: true
  },
  Production: {
    download: true,
    proofPDF: true,
    ceTrack: true,
    generateTrack: true,
    finalize: true,
    comments: true,
    queries: true,
    save: true,
    share: true
  },
  Admin: {
    download: true,
    proofPDF: true,
    ceTrack: true,
    generateTrack: true,
    finalize: true,
    comments: true,
    queries: true,
    save: true,
    share: true
  }
};

export const DEFAULT_CLIENT_ID = 'PLOS';
export const DEFAULT_ROLE = 'Editor';
