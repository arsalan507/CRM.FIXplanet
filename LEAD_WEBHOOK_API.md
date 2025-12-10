# Lead Webhook API Documentation

## Overview
This API endpoint receives lead submissions from your landing pages and automatically creates them in your CRM database.

## Endpoint
```
POST https://your-crm-domain.com/api/leads/webhook
```

## Authentication
Include the API key in the request header:
```
X-API-Key: 3f19aa3eaa47dd944e49b97263996a17e94915900d05c5efaba72b1e7ba9d75e
```

## Request Format

### Minimal Example (LP-1 format)
```json
{
  "device": "iPhone",
  "model": "iPhone 13 Pro",
  "issue": "Battery",
  "name": "John Doe",
  "phone": "9876543210",
  "source": "LP-1",
  "landingPage": "https://fixplanet.com/lp-1?utm_source=google&utm_campaign=test"
}
```

### Full Example
```json
{
  "name": "Parv Manglani",
  "phone": "+91 8827742820",
  "email": "parv@example.com",
  "device": "iPhone",
  "model": "iPhone XS Max",
  "issue": "Original screen",
  "source": "iPhone Screen Cracked Landing Page",
  "landingPage": "https://www.fixplanetwithcare.com/lp-1?gad_source=1&gad_campaignid=23243980516&utm_source=google&utm_medium=cpc"
}
```

## Field Mapping

The API accepts flexible field names and maps them to CRM schema:

| Landing Page Field | CRM Field | Required | Notes |
|-------------------|-----------|----------|-------|
| `name`, `customer_name` | `customer_name` | ✅ Yes | |
| `phone`, `contact_number` | `contact_number` | ✅ Yes | Auto-normalized (removes +91, spaces) |
| `device`, `device_type` | `device_type` | ✅ Yes | Auto-normalized (iWatch → Apple Watch) |
| `model`, `device_model` | `device_model` | ✅ Yes | |
| `issue`, `issue_reported` | `issue_reported` | ✅ Yes | |
| `email` | `email` | ❌ No | Optional |
| `source`, `lead_source` | `lead_source` | ❌ No | Auto-extracted from URL if missing |
| `landingPage`, `url` | `landing_page_url` | ❌ No | UTM params extracted automatically |

## Response Format

### Success (201 Created)
```json
{
  "success": true,
  "message": "Lead created successfully",
  "lead_id": "uuid-here",
  "duplicate": false
}
```

### Duplicate (200 OK)
If the same phone number submitted within 24 hours, the lead is updated:
```json
{
  "success": true,
  "message": "Lead updated successfully (duplicate within 24h)",
  "lead_id": "existing-uuid",
  "duplicate": true
}
```

### Error (400 Bad Request)
```json
{
  "success": false,
  "error": "Missing required fields: phone, issue",
  "received_fields": ["name", "device", "model"]
}
```

### Error (401 Unauthorized)
```json
{
  "success": false,
  "error": "Unauthorized - Invalid API key"
}
```

## Features

### ✅ Flexible Field Names
Accepts variations: `phone` / `contact_number` / `mobile` all work

### ✅ Auto-Normalization
- Phone: `+91 9876543210` → `9876543210`
- Device: `iWatch` → `Apple Watch`
- Lead Source: Extracted from URL or source field

### ✅ UTM Parameter Extraction
Automatically extracts from landing page URL:
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`
- `gclid`, `fbclid`

### ✅ Duplicate Detection
Checks for same phone number in last 24 hours. Updates existing lead instead of creating duplicate.

### ✅ Comprehensive Logging
All requests logged with timing information for debugging.

## Testing

### Test with curl
```bash
curl -X POST http://localhost:3000/api/leads/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 3f19aa3eaa47dd944e49b97263996a17e94915900d05c5efaba72b1e7ba9d75e" \
  -d '{
    "device": "iPhone",
    "model": "iPhone 13 Pro",
    "issue": "Battery",
    "name": "Test User",
    "phone": "9876543210",
    "source": "LP-1",
    "landingPage": "https://fixplanet.com/lp-1?utm_source=google&utm_campaign=test"
  }'
```

### Test with JavaScript (Landing Page Integration)
```javascript
async function submitToFixplanetCRM(formData) {
  try {
    const response = await fetch('https://your-crm-domain.com/api/leads/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': '3f19aa3eaa47dd944e49b97263996a17e94915900d05c5efaba72b1e7ba9d75e'
      },
      body: JSON.stringify({
        device: formData.device,
        model: formData.model,
        issue: formData.issue,
        name: formData.name,
        phone: formData.phone,
        source: 'LP-1',
        landingPage: window.location.href
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Lead created in CRM:', result.lead_id);
      return true;
    } else {
      console.error('Failed to create lead:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error submitting to CRM:', error);
    return false;
  }
}
```

## Integration with Existing Landing Page

Update your `/api/send-email/route.ts` to also send to CRM:

```typescript
// After sending email via Resend (around line 141)
// Also send to CRM
try {
  const crmResponse = await fetch('http://localhost:3000/api/leads/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.LEAD_WEBHOOK_API_KEY!
    },
    body: JSON.stringify({
      device,
      model,
      issue,
      name,
      phone,
      source,
      landingPage
    })
  });

  const crmResult = await crmResponse.json();
  console.log('CRM sync result:', crmResult);
} catch (error) {
  console.error('Failed to sync to CRM:', error);
  // Don't fail the whole request if CRM sync fails
}
```

## Security

- ✅ API Key authentication required
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Supabase handles this)
- ✅ Rate limiting recommended (implement at proxy/CDN level)
- ✅ CORS headers included for cross-origin requests

## Production Deployment

1. **Update API Key**: Replace `LEAD_WEBHOOK_API_KEY` in production `.env`
2. **Update CRM URL**: Change from `localhost:3000` to your production domain
3. **Add Rate Limiting**: Configure at Vercel/CDN level (max 100 req/hour per IP)
4. **Monitor Logs**: Check Vercel logs for any errors
5. **Test First**: Always test with sample data before going live

## Troubleshooting

### "Missing required fields" error
- Check that all 5 required fields are sent: `name`, `phone`, `device`, `model`, `issue`
- Field names are case-sensitive but flexible (e.g., `phone` or `contact_number` both work)

### "Invalid phone number format" error
- Phone must be 10 digits after normalization
- System auto-removes +91, spaces, dashes

### "Unauthorized" error
- Check that `X-API-Key` header is included
- Verify API key matches `.env.local` value

### Lead not appearing in CRM
- Check server logs in Vercel dashboard
- Verify Supabase connection is working
- Test endpoint with curl first

## Support

For issues or questions:
- Check server logs: `[Lead Webhook]` prefix
- Review this documentation
- Test with curl command above
