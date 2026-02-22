# Authentication & API Integration Guide

## 🎯 Overview

Complete authentication system with admin features and global API access has been integrated into your existing React + Vite project.

## 📁 New Files Added

### API Service
```
src/services/api/
└── apiService.js          # Global API service with all REST endpoints
```

### Authentication
```
src/context/
└── AuthContext.jsx        # Authentication state management

src/routes/
├── ProtectedRoute.jsx     # Route protection component
└── AppRouter.jsx          # Updated with auth integration

src/pages/
└── Login.jsx              # Login page (new)
```

## 🔧 Environment Variables

Add these to your `.env` file:

```env
# API Configuration
VITE_BACKEND_DOMAIN=localhost:8080
VITE_API_PATH=/api/
VITE_API_KEY=your_api_key
VITE_User_API_KEY=your_user_api_key
VITE_APP_KEY=your_app_key
VITE_BUCKET_URL=https://your-bucket-url/
VITE_VERSION=1.0.0

# Environment flags
VITE_IS_LIVE_DOMAIN=false
VITE_IS_DEV_DOMAIN=false
VITE_IS_UAT_DOMAIN=false
```

## 🚀 Usage

### 1. Using Auth Context

```jsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isAdmin, 
    isSuperAdmin,
    login, 
    logout,
    userRole 
  } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <p>Welcome, {user.username}</p>
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### 2. Using Global API Service

```jsx
import { apiService, API_ENDPOINTS } from './services/api/apiService';

// Method 1: Using predefined methods
const docs = await apiService.getDocs({ userId: '123' });
const users = await apiService.getUsers();

// Method 2: Using generic makeRequest
const response = await apiService.makeRequest(
  API_ENDPOINTS.SHARE_INVITE,
  { docId: 'abc123', userId: 'xyz' }
);

// Method 3: Access globally (legacy support)
window.apiService.getDocs({ userId: '123' });
```

### 3. Protected Routes

Routes are automatically protected in AppRouter:

```jsx
// Automatically redirects to /login if not authenticated
/dashboard         - Accessible to all authenticated users
/admindashboard    - Only accessible to admins
/editor            - Accessible to all authenticated users
```

### 4. Admin Features

Check admin status anywhere:

```jsx
import { ADMIN_CONFIG } from './services/api/apiService';

// Check if super admin
const isSuperAdmin = ADMIN_CONFIG.checkIsSuperAdmin(userId);

// Check if admin (from localStorage)
const isAdmin = ADMIN_CONFIG.checkIsAdmin();
```

## 📊 API Endpoints Available

All endpoints are available in `API_ENDPOINTS`:

```javascript
API_ENDPOINTS.GET_USERS          // Get all users
API_ENDPOINTS.GET_DOCS           // Get documents
API_ENDPOINTS.GET_ADMINDOCS      // Get all docs (admin)
API_ENDPOINTS.UPDATE_USERS       // Update user
API_ENDPOINTS.DEL_RECORD         // Delete document
API_ENDPOINTS.UPLOAD_SINGLE      // Upload file
API_ENDPOINTS.UPLOAD_MULTI       // Upload multiple files
API_ENDPOINTS.SHARE_INVITE       // Share and invite
API_ENDPOINTS.GENERIC_SEND_MAIL  // Send email
API_ENDPOINTS.PUBKIT_STATUS      // Pubkit status
API_ENDPOINTS.CHATBOT_AI         // AI chatbot
// ... and 20+ more
```

## 🔐 Admin Authentication

### Super Admin IDs (hardcoded)
```javascript
ADMIN_USER_IDs: [
  "sivakumars",
  "yasar.mohideen", 
  "durairajan.gnanam"
]
```

### Checking Admin Status
```javascript
// Method 1: From localStorage (set on login)
const adminUser = localStorage.getItem('xmleditor:admin');
const isAdmin = adminUser === "superadmin";

// Method 2: From AuthContext
const { isAdmin, isSuperAdmin } = useAuth();

// Method 3: Direct check
import { ADMIN_CONFIG } from './services/api/apiService';
const isSuperAdmin = ADMIN_CONFIG.checkIsSuperAdmin('sivakumars');
```

## 🎨 Role-Based Access

### Available Roles
```javascript
ROLE_IDS = {
  "5b53536b4c4a803e9a5abf70": "Author",
  "5b534e334c4a803e9a5abf4c": "Editor",
  "5bcf15b1cf510152afba028a": "Collator",
  "5bd1c4e2cf51015102014427": "Copyeditor",
  "5b534dc54c4a803e9a5abf41": "Project Manager",
  "5b534e5b4c4a803e9a5abf4f": "Journal Manager",
  "5bcf11635e7186178a22eee0": "Proofreader",
  "5b534de04c4a803e9a5abf45": "Production Editor"
}
```

### Using Roles
```jsx
const { userRole, ROLE_IDS, hasRole, getRoleDetails } = useAuth();

// Check specific role
if (hasRole("5b53536b4c4a803e9a5abf70")) {
  // User is an Author
}

// Get role details
const roleInfo = getRoleDetails();
// roleInfo.name = "Author"
// roleInfo.Stage = "Proofing"
// roleInfo.SelectorAttribute = "showForAU"
```

## 📱 Global Access (Legacy Support)

All APIs are available globally via `window`:

```javascript
// API Service
window.apiService.getDocs();
window.apiService.getUsers();

// Config
window.API_ENDPOINTS
window.ROLE_IDS
window.ADMIN_CONFIG
window.IS_LOCAL_HOST
window.BACKEND_DOMAIN
window.API_PATH
// ... etc
```

## 🔄 Login Flow

1. User enters credentials on `/login`
2. `AuthContext.login()` is called
3. API call to login endpoint
4. On success:
   - User data stored in localStorage
   - Admin status checked
   - Redirect to `/dashboard`
5. On failure: Error message displayed

## 🧪 Testing

Test admin access:
```javascript
// In browser console
localStorage.setItem('xmleditor:admin', 'superadmin');
// Refresh page - should now have admin access
```

Test with super admin user:
```javascript
localStorage.setItem('xmleditor:userid', 'sivakumars');
// Refresh page - should have super admin access
```

## 📋 Available LocalStorage Keys

```
xmleditor:user       - Full user object
xmleditor:token      - Auth token
xmleditor:username   - Username
xmleditor:userid     - User ID
xmleditor:admin      - "superadmin" if admin
```

## 🎯 Next Steps

1. Set up your environment variables in `.env`
2. Configure your backend API endpoints
3. Test login with valid credentials
4. Verify admin features work correctly
5. Customize the Login and Dashboard pages as needed

All files are now integrated and ready to use! 🚀
