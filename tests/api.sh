#!/bin/bash

# Base URL for the local environment
API_URL="http://localhost:3000/api/audit"

echo "============================================="
echo "   SEO Audit API – Postman Test cURLs        "
echo "============================================="

echo -e "\n[1] Valid Request - Testing a standard HTTPS URL"
echo "Expected: 200 OK with metrics, analysis, and recommendations"
echo "------------------------------------------------------------"
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'

echo -e "\n\n[2] Invalid Request - Missing URL"
echo "Expected: 400 Bad Request (Validation Error)"
echo "------------------------------------------------------------"
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{}'

echo -e "\n\n[3] Invalid Request - Bad URL Format"
echo "Expected: 400 Bad Request (Validation Error)"
echo "------------------------------------------------------------"
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "url": "not-a-valid-url"
  }'

echo -e "\n\n[4] Invalid Request - Non-Existent Domain"
echo "Expected: 422 Unprocessable Entity (Fetch Error)"
echo "------------------------------------------------------------"
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://this-domain-definitely-does-not-exist-12345.com"
  }'

echo -e "\n\n[5] Invalid Request - Wrong HTTP Method (GET)"
echo "Expected: 405 Method Not Allowed"
echo "------------------------------------------------------------"
curl -X GET $API_URL \
  -H "Content-Type: application/json"

echo -e "\n\n============================================="
echo "Done."
