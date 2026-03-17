# Postman / cURL Testing Guide

Use the following cURL commands to test the `/api/audit` endpoint. You can run these directly in your terminal or import them into Postman by selecting **File > Import > Raw text** and pasting the cURL command.

Ensure your Next.js development server is running (`npm run dev` or `pnpm dev`) on `localhost:3000` before executing these.

---

### 1. Valid Request (Successful Audit)
Expected Result: `200 OK`
Returns a JSON object with `metrics`, `analysis`, and `recommendations`.

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'
```

---

### 2. Validation Error (Missing URL)
Expected Result: `400 Bad Request`
Returns a Zod validation error because the `url` field is missing.

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### 3. Validation Error (Invalid URL Format)
Expected Result: `400 Bad Request`
Returns a Zod validation error because the URL doesn't include `http://` or `https://`.

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "url": "not-a-valid-url"
  }'
```

---

### 4. Fetch Error (Non-Existent/Unreachable Domain)
Expected Result: `422 Unprocessable Entity`
Returns a fetch error because the domain cannot be resolved.

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://this-domain-definitely-does-not-exist-12345.com"
  }'
```

---

### 5. Method Not Allowed (GET Request)
Expected Result: `405 Method Not Allowed`
Returns an error because the endpoint only accepts POST requests.

```bash
curl -X GET http://localhost:3000/api/audit \
  -H "Content-Type: application/json"
```
