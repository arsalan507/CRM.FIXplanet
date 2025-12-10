#!/bin/bash

# Test script for Lead Webhook API
# Usage: ./test-webhook.sh

echo "🧪 Testing Lead Webhook API..."
echo ""

# Test 1: Valid lead from LP-1
echo "Test 1: Valid LP-1 lead submission"
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
  }' | json_pp

echo ""
echo "---"
echo ""

# Test 2: Lead with email and full UTM params
echo "Test 2: Lead with email and UTM parameters"
curl -X POST http://localhost:3000/api/leads/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 3f19aa3eaa47dd944e49b97263996a17e94915900d05c5efaba72b1e7ba9d75e" \
  -d '{
    "name": "Parv Manglani",
    "phone": "+91 8827742820",
    "email": "parv@example.com",
    "device": "iPhone",
    "model": "iPhone XS Max",
    "issue": "Original screen",
    "source": "iPhone Screen Cracked Landing Page",
    "landingPage": "https://fixplanet.com/lp-1?utm_source=google&utm_medium=cpc&utm_campaign=23243980516&gclid=test123"
  }' | json_pp

echo ""
echo "---"
echo ""

# Test 3: iWatch → Apple Watch conversion
echo "Test 3: iWatch device type normalization"
curl -X POST http://localhost:3000/api/leads/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 3f19aa3eaa47dd944e49b97263996a17e94915900d05c5efaba72b1e7ba9d75e" \
  -d '{
    "device": "iWatch",
    "model": "Series 8",
    "issue": "Screen",
    "name": "Watch User",
    "phone": "9988776655",
    "source": "LP-2"
  }' | json_pp

echo ""
echo "---"
echo ""

# Test 4: Missing required field (should fail)
echo "Test 4: Missing required field (should return 400 error)"
curl -X POST http://localhost:3000/api/leads/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 3f19aa3eaa47dd944e49b97263996a17e94915900d05c5efaba72b1e7ba9d75e" \
  -d '{
    "device": "iPhone",
    "model": "iPhone 12",
    "name": "Incomplete User"
  }' | json_pp

echo ""
echo "---"
echo ""

# Test 5: Invalid API key (should fail)
echo "Test 5: Invalid API key (should return 401 error)"
curl -X POST http://localhost:3000/api/leads/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-api-key" \
  -d '{
    "device": "iPhone",
    "model": "iPhone 12",
    "issue": "Screen",
    "name": "Test",
    "phone": "1234567890"
  }' | json_pp

echo ""
echo "✅ Tests completed!"
