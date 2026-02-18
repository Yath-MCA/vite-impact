import { CLIENT_CONFIGS } from '../context/ClientContext';

export const loadClientById = (clientId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const config = CLIENT_CONFIGS[clientId];
      if (config) {
        resolve(config);
      } else {
        reject(new Error(`Client "${clientId}" not found`));
      }
    }, 500);
  });
};

export const validateClientUrl = (url) => {
  const pattern = /^\/validateurl\/([a-z0-9-]+)$/i;
  const match = url.match(pattern);
  return match ? match[1] : null;
};

export const generateMockGridData = (count = 100) => {
  const data = [];
  const statuses = ['Active', 'Inactive', 'Pending', 'Archived'];
  const types = ['Document', 'Report', 'Template', 'Contract'];
  
  for (let i = 1; i <= count; i++) {
    data.push({
      id: i,
      name: `Item ${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      modifiedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      size: Math.floor(Math.random() * 1000) + ' KB',
      owner: `User ${Math.floor(Math.random() * 10) + 1}`,
      priority: Math.floor(Math.random() * 5) + 1
    });
  }
  
  return data;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
