# Landing Page Integration Guide

## How to Connect Your Landing Pages to CRM

This guide shows you how to modify your landing page's `/api/send-email/route.ts` to automatically send leads to your CRM database.

## Step 1: Add Environment Variable to Landing Page

In your landing page project (`~/Documents/kineticxhub/website/FIXplanetwebsite/landing-page/`), add this to `.env.local`:

```bash
# CRM Integration
CRM_API_URL=https://your-crm-domain.vercel.app/api/leads/webhook
CRM_API_KEY=3f19aa3eaa47dd944e49b97263996a17e94915900d05c5efaba72b1e7ba9d75e
```

**For local development**, use:
```bash
CRM_API_URL=http://localhost:3000/api/leads/webhook
```

## Step 2: Update `/api/send-email/route.ts`

Add this code to your existing `send-email/route.ts` file **AFTER** the Resend email is sent (after line 141):

```typescript
// FILE: landing-page/app/api/send-email/route.ts

import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device, model, issue, name, phone, source, landingPage } = body;

    // 1. Send email using Resend (existing code - keep as is)
    const { data, error } = await resend.emails.send({
      from: 'FIXplanet Leads <onboarding@resend.dev>',
      to: ['hello@fixplanet.in'],
      subject: `New Lead from ${source || 'Landing Page'}`,
      html: `... existing HTML template ...`,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    // 2. ✨ NEW CODE: Also send to CRM ✨
    try {
      console.log('📤 Syncing lead to CRM...');

      const crmResponse = await fetch(process.env.CRM_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.CRM_API_KEY!,
        },
        body: JSON.stringify({
          device,
          model,
          issue,
          name,
          phone,
          source: source || 'LP-1',
          landingPage
        }),
      });

      const crmResult = await crmResponse.json();

      if (crmResult.success) {
        console.log('✅ Lead synced to CRM:', crmResult.lead_id);
      } else {
        console.error('❌ CRM sync failed:', crmResult.error);
        // Don't fail the whole request - email was already sent
      }
    } catch (crmError) {
      console.error('❌ Error syncing to CRM:', crmError);
      // Don't fail the whole request - email was already sent
    }

    // Return success (email sent successfully)
    return NextResponse.json(
      { success: true, message: 'Email sent successfully', data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
```

## Step 3: Deploy and Test

### Local Testing

1. **Start your CRM server:**
   ```bash
   cd ~/Desktop/CRM.FIXPLANET
   npm run dev
   ```

2. **Start your landing page server:**
   ```bash
   cd ~/Documents/kineticxhub/website/FIXplanetwebsite/landing-page
   npm run dev
   ```

3. **Submit a test form** on your landing page (http://localhost:3001 or whatever port)

4. **Check CRM** - Lead should appear in http://localhost:3000/leads

### Production Deployment

1. **Deploy CRM to Vercel** (if not already)
   ```bash
   cd ~/Desktop/CRM.FIXPLANET
   vercel
   ```

2. **Get your CRM production URL** (e.g., `https://crm-fixplanet.vercel.app`)

3. **Update landing page `.env.local`** (or Vercel environment variables):
   ```bash
   CRM_API_URL=https://crm-fixplanet.vercel.app/api/leads/webhook
   CRM_API_KEY=3f19aa3eaa47dd944e49b97263996a17e94915900d05c5efaba72b1e7ba9d75e
   ```

4. **Deploy landing page:**
   ```bash
   cd ~/Documents/kineticxhub/website/FIXplanetwebsite/landing-page
   vercel
   ```

## Alternative: Frontend Direct Integration

If you prefer, you can also call the CRM API directly from your landing page frontend:

```typescript
// In your page.tsx, after form submission (around line 98)

const handleFinalSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsSubmitting(true);

  const data = {
    device: selectedDevice,
    model: selectedModel,
    issue: selectedIssue,
    name,
    phone,
    source: 'iPhone Screen Cracked Landing Page',
    landingPage: window.location.href,
  };

  try {
    // Send to email API (existing code)
    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // ✨ NEW: Also send directly to CRM ✨
    const crmResponse = await fetch('https://your-crm-domain.vercel.app/api/leads/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'YOUR_API_KEY_HERE', // Note: Exposing API key in frontend!
      },
      body: JSON.stringify(data),
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to submit form');
    }

    // Show success
    setIsSubmitting(false);
    setFormStep(3);
  } catch (error) {
    console.error('Error:', error);
    setIsSubmitting(false);
    alert('Error submitting. Please call us at ' + contactPhone);
  }
};
```

⚠️ **Note:** Frontend integration exposes your API key to users. Backend integration (Option 1) is more secure.

## Verification Checklist

✅ Environment variables added to landing page
✅ Code updated in `/api/send-email/route.ts`
✅ Tested locally - lead appears in CRM
✅ CRM deployed to production
✅ Landing page deployed with production CRM URL
✅ Production test - submitted real form
✅ Checked CRM - lead appeared
✅ Email still being sent via Resend

## Troubleshooting

### Lead not appearing in CRM

1. **Check landing page server logs:**
   - Look for "📤 Syncing lead to CRM..."
   - Look for "✅ Lead synced to CRM:" or "❌ CRM sync failed:"

2. **Check CRM server logs:**
   - Look for "[Lead Webhook] Received data:"
   - Check for any error messages

3. **Verify environment variables:**
   ```bash
   # In landing page terminal:
   echo $CRM_API_URL
   echo $CRM_API_KEY
   ```

4. **Test CRM API directly:**
   ```bash
   curl -X POST https://your-crm-domain.vercel.app/api/leads/webhook \
     -H "Content-Type: application/json" \
     -H "X-API-Key: YOUR_API_KEY" \
     -d '{"device":"iPhone","model":"Test","issue":"Test","name":"Test","phone":"1234567890"}'
   ```

### Email working but CRM sync failing

- CRM sync errors don't affect email delivery
- Check CRM logs for specific error
- Verify API key matches in both systems
- Check CRM is deployed and accessible

### "Invalid API key" error

- Verify `CRM_API_KEY` in landing page matches `LEAD_WEBHOOK_API_KEY` in CRM
- Check for extra spaces or line breaks in `.env.local`
- Restart both servers after changing environment variables

## What Happens Now?

Once integrated:

1. **User submits form** on landing page → Page submits to `/api/send-email`
2. **Email sent** via Resend → You receive email notification (existing)
3. **Lead sent to CRM** → Lead automatically created in CRM database (new!)
4. **You see lead** in CRM dashboard → Assign to sales executive, track status, etc.

No more manual copy-paste from emails! 🎉
