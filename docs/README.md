# TubeInsight API Documentation

This directory contains comprehensive API documentation for the TubeInsight application.

## 📁 Files Overview

- **`api-documentation.md`** - Complete API reference documentation in Markdown format
- **`openapi.yaml`** - OpenAPI 3.0 specification file for interactive documentation
- **`swagger-ui.html`** - Standalone HTML file with Swagger UI for interactive API exploration
- **`README.md`** - This file, explaining how to use the documentation

## 🚀 Quick Start

### Option 1: View Static Documentation
Simply open `api-documentation.md` in any Markdown viewer or GitHub to read the complete API reference.

### Option 2: Interactive Swagger UI (Recommended)

1. **Serve the documentation locally:**
   ```bash
   # From the docs directory
   cd /home/ubuntu/TubeInsight/docs
   
   # Using Python's built-in server
   python3 -m http.server 8080
   
   # Or using Node.js (if available)
   npx serve -p 8080
   ```

2. **Open in browser:**
   ```
   http://localhost:8080/swagger-ui.html
   ```

3. **Authenticate:**
   - Click the "Authorize" button in Swagger UI
   - Enter your Supabase JWT token
   - Now you can test API endpoints directly!

### Option 3: Integrate with Your Application

You can serve the documentation as part of your TubeInsight application:

1. **Add to Next.js frontend:**
   ```bash
   # Copy files to public directory
   cp docs/* frontend/public/docs/
   ```

2. **Access via:**
   ```
   http://localhost:3000/docs/swagger-ui.html
   ```

## 🔧 Development Setup

### Updating the Documentation

1. **Modify the OpenAPI spec:**
   Edit `openapi.yaml` to add new endpoints or update existing ones.

2. **Update the Markdown docs:**
   Edit `api-documentation.md` to reflect changes.

3. **Validate the OpenAPI spec:**
   ```bash
   # Using swagger-codegen (if installed)
   swagger-codegen validate -i openapi.yaml
   
   # Or online validator
   # Upload openapi.yaml to https://editor.swagger.io/
   ```

### Auto-generating Documentation

You can generate documentation from your Flask routes using tools like:

```bash
# Install flask-restx for automatic OpenAPI generation
pip install flask-restx

# Or use apispec
pip install apispec[yaml]
```

## 📖 Documentation Structure

### Core Endpoints
- **Video Analysis** - Main functionality for analyzing YouTube videos
- **Analysis History** - Retrieving past analysis results
- **Admin Management** - User and system administration

### Authentication
All endpoints (except health checks) require Supabase JWT authentication:
```
Authorization: Bearer <your_jwt_token>
```

### Rate Limiting
- Analysis endpoints: 10 requests/minute per user
- History endpoints: 60 requests/minute per user
- Admin endpoints: 100 requests/minute per admin

## 🛠️ Customization

### Swagger UI Themes
You can customize the Swagger UI appearance by modifying the CSS in `swagger-ui.html`:

```css
/* Custom theme colors */
.swagger-ui .topbar {
    background-color: #your-color;
}

.custom-header {
    background: linear-gradient(135deg, #your-gradient);
}
```

### Adding Examples
Add more request/response examples in `openapi.yaml`:

```yaml
examples:
  success_response:
    summary: Successful analysis
    value:
      message: "Analysis completed"
      analysis_id: "123e4567-e89b-12d3-a456-426614174000"
```

## 🔗 Integration Examples

### JavaScript/TypeScript
```typescript
const response = await fetch('/api/analyze-video', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    videoUrl: 'https://www.youtube.com/watch?v=VIDEO_ID'
  })
});
```

### Python
```python
import requests

response = requests.post(
    'https://your-domain.com/api/analyze-video',
    headers={'Authorization': f'Bearer {token}'},
    json={'videoUrl': 'https://www.youtube.com/watch?v=VIDEO_ID'}
)
```

### cURL
```bash
curl -X POST "https://your-domain.com/api/analyze-video" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"}'
```

## 📝 Contributing

When adding new API endpoints:

1. Update the Flask route implementation
2. Add the endpoint to `openapi.yaml`
3. Update `api-documentation.md` with examples
4. Test the endpoint in Swagger UI
5. Add integration examples if needed

## 🚀 Deployment

### Production Deployment

1. **Host documentation on your domain:**
   ```nginx
   # Add to your nginx config
   location /docs {
       alias /path/to/tubeinsight/docs;
       index swagger-ui.html;
   }
   ```

2. **Update base URLs:**
   Edit `openapi.yaml` to use your production domain:
   ```yaml
   servers:
     - url: https://your-production-domain.com/api
       description: Production server
   ```

3. **Enable HTTPS:**
   Ensure your documentation is served over HTTPS in production.

## 📞 Support

For API documentation questions:
- **GitHub Issues:** [Create an issue](https://github.com/your-org/tubeinsight/issues)
- **Email:** api-docs@tubeinsight.com
- **Documentation:** This README and the files in this directory

## 🔄 Changelog

### v1.0.0 (2024-01-20)
- Initial API documentation release
- Complete OpenAPI 3.0 specification
- Interactive Swagger UI
- Comprehensive endpoint documentation
- Authentication and rate limiting documentation
