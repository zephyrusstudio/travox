# TMS Authentication Test Frontend

A simple single-page application to test the Google OIDC authentication flow and TMS API endpoints.

## 🚀 Quick Start

1. **Start the TMS API server**:
   ```bash
   cd /Users/ark/Developer/Zephyrus/TMS
   bun run dev
   ```

2. **Open the test page**:
   ```bash
   open auth-test-fe/index.html
   ```
   Or simply open `index.html` in your browser.

## ⚙️ Configuration

### Google Client ID Setup

1. **Get your Google Client ID**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create or select a project
   - Enable the Google Sign-In API
   - Create OAuth 2.0 credentials
   - Add `http://localhost` and your domain to authorized origins

2. **Configure the test page**:
   - Enter your Google Client ID in the configuration section
   - Update the API Base URL if needed (default: `http://localhost:3000`)
   - Click "Update Config"

### Environment Variables

Make sure your TMS API has the following environment variables set:

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
ALLOWED_DOMAINS=your-company.com,another-domain.com  # Optional
```

## 🧪 Testing Flow

### 1. Authentication
- Click "Sign in with Google" button
- Complete Google OAuth flow
- The app will automatically authenticate with the TMS API
- Your user info will be displayed

### 2. API Testing
Test various endpoints organized by category:

- **🌐 Public Endpoints**: Health check, ping
- **👥 User Management**: Profile, user CRUD operations
- **🏢 Customer Management**: Customer CRUD operations  
- **🏪 Vendor Management**: Vendor CRUD operations
- **📅 Booking Management**: Booking CRUD operations
- **📋 Audit Logs**: View system audit logs

### 3. Token Management
- **Refresh Token**: Test token refresh functionality
- **Logout**: Clear session and tokens

## 🔍 Features

- ✅ **Google OIDC Authentication**: Full OAuth flow with Google
- ✅ **Token Management**: Automatic token handling and refresh
- ✅ **API Testing**: Pre-configured buttons for all TMS endpoints
- ✅ **Response Viewer**: Real-time API response display
- ✅ **Error Handling**: Clear error messages and status indicators
- ✅ **Cookie Support**: Handles HTTP-only refresh token cookies
- ✅ **CORS Ready**: Configured for local development

## 🛠️ Troubleshooting

### Common Issues

1. **"Invalid Google ID token"**:
   - Check that your Google Client ID is correct
   - Ensure the TMS API has the same `GOOGLE_CLIENT_ID` environment variable

2. **CORS Errors**:
   - Make sure the TMS API is running on `http://localhost:3000`
   - Check that CORS is properly configured in the API

3. **Authentication Failed**:
   - Verify your email domain is in the `ALLOWED_DOMAINS` list (if configured)
   - Check the browser console for detailed error messages

4. **API Endpoints Return 401**:
   - Ensure you're logged in
   - Try refreshing your token
   - Check that the access token is being sent in the Authorization header

### Debug Tips

- Open browser developer tools to see network requests
- Check the Console tab for JavaScript errors
- Verify cookies are being set correctly in the Application tab

## 📝 API Endpoint Testing

The test page includes buttons for:

- **GET /health** - Health check
- **GET /ping** - Ping endpoint
- **GET /users/me** - Get current user profile
- **GET /users** - List all users
- **POST /users** - Create new user
- **GET /customers** - List customers
- **POST /customers** - Create customer
- **GET /vendors** - List vendors
- **POST /vendors** - Create vendor
- **GET /bookings** - List bookings
- **POST /bookings** - Create booking
- **GET /audit-logs** - View audit logs

Each request will show the full response with status codes, headers, and data.

## 🔐 Security Notes

- This is a **development testing tool only**
- Never use this in production
- Google Client ID should be kept secure
- The test page handles tokens securely using HTTP-only cookies
