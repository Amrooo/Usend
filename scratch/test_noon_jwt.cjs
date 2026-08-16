const https = require('https');
const crypto = require('crypto');

const creds = {
    "key_id": "noon-partners-key-id-37f0867306304eec8f901eb2a6945f41",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1MCRj9YiHjiXB\n+noNYQfQ76wabCPWTga+9wXXn01ri2nqI1E0AeMH4AhJgFnH6vxWk4P1yibYpuwK\nw68gxcQB9oYqsn4UZ9QQd0BACxKVkoHFN4TGHOqFIMXmj8SriMArtXLOKhIw7gC8\nfkKyFTtaTpNQflYVxdZglVjHHC3rYgZLBkV6giyqJU44TBzPknlre5caa1KttCoW\nmcGx67jh4oq77xKOiMIFx3CVFiOYekLuFZrZvLLZi4GFie0a26c2QYkgEiJtU+ld\ng0yR/3Pq5P16Eb7asrH+Bfq+tUI6TgB+7DHVbVstSGm6EkkTJVxHic/sj9UAm2mb\nCJds8zLLAgMBAAECggEANttGiUUTewccg2hUf6x681U9JBrNltq0zCh6Clhe1kq1\nXIAo27gehonbuHU1uYN5trSe5VG5BSs0l+W7Jg76UyXSZSb5aTAuUnXoa/tuOv7K\nb21ps5mZn4jWogGxJ8YVeKZNBgJS06Gbc3Y+tzAacjMMAvjdE2Z8i21sHYx4kqTt\n1+dWmABU/qfNU2d/Nx+/80hylvWPHuvBZguIbdo10uNEOiVMcHU2q8zoIbxREIK4\nrZ9DwfCLOh8CEx0L3bi9t8EsfRJmAXuUUOz6D1NR5VaFj3kBbpPIzZBHBmbOidGY\nE8xzpNrUgMP3lz7pcWVr1z42A++T/pC0DvpGIDBeQQKBgQDwFozZwejqMtSVXYuv\nMW5zG1jge45mmwkqNdb6QJlzhhsnk4ODSQ5qApT7QNO1rV1h4vUazvb5mf+bH7Co\nsL4h6a5b8xIsB8ygkRhLVAtRCl/T+fozsUPkjSiId1LWS6yKRex8NceRWcAuXWf1\nAiCfxTTQtdtLM/o1M4gdJm7T2wKBgQDBMkQGtSEG0hU+lI35Qpodch04AjtPxdau\navRKYRu5zBAqZaIMwjfbx5h81GvixfvcUSIvd4gdYmeKMvmPn3Gsnie54Ym3IIjI\nmTTbDGR4byH15In/cHsecpR3LD2wy2gggpWpr3WRu+PHg0mHfVT4asW+V0Zh7jei\nEyUQ8CvH0QKBgQDEOtoifQ/eo28HKe8qYO+SWy64Q6RvDpZeDqVH4xbIyjpVjYb2\n/fYvBS85cJHZMvpZMEP/BlvsREcbRbqBFfxBAZsGAlS+8hz4u76siuO4+A681dr+\n9wqzugAAEe79wdojJeWU2+viTAX8n1GBepypmWiCkbDL9Y6yfwzoLmp08wKBgE/R\n+cMfsM6Fm9toOyRB/TSvQh0y5th1r9YOQHI+ntrr0b4Ckapd0ABQ/dKNXSmrjPyg\n1NPxud4SGx9BIlTRloCwM0+cPG7Z1Umz6t+ZxiTwHYLfcpiEG4of4vE96RsTXykX\nashZwuR8UYbL2mRNRv7/9kVG/8BUUM34xPazlBMRAoGBAMKbNxtVMRBdtc2leIuk\nBdbrM9aW0WxyZiNuS8MJ2vU1qcyZvIeeK4i8BYKj9MV9awKg0Ud4PdGX+Gdi/Kyg\nyo9UY/91EKIVBwRnF47vfu9JkFE2XiPOsZdZOhHuM6wvHXrTXNqSUOQfvfIgyyX3\n5erYFlFZfKOTL5YNtWuVJKjO\n-----END PRIVATE KEY-----\n",
    "channel_identifier": "usend@p571252.idp.noon.partners",
    "project_code": "PRJ571252",
    "type": "apijwt",
    "issued_at": "2026-08-16T13:38:46.808473+00:00"
};

function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createSignedJwt(creds) {
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: creds.key_id
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: creds.channel_identifier,
    sub: creds.channel_identifier,
    aud: "https://identity.noon.partners",
    iat: now,
    exp: now + 3600
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(creds.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsignedToken}.${signature}`;
}

function makeRequest(urlStr, headers, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(urlStr);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: headers,
      rejectUnauthorized: false,
      timeout: 8000
    }, (res) => {
      let resp = '';
      res.on('data', chunk => resp += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resp) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resp });
        }
      });
    });

    req.on('error', (e) => resolve({ error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testAllAuth() {
  const jwt = createSignedJwt(creds);
  console.log("Generated Signed JWT:", jwt.slice(0, 50) + "...");

  console.log("\n=== 1. Test X-API-KEY with key_id ===");
  let res = await makeRequest("https://food-api-team.noon.team/public/v1/pickup-points/list", {
    "X-API-KEY": creds.key_id
  });
  console.log("Status:", res.status, JSON.stringify(res.data || res.raw));

  console.log("\n=== 2. Test Authorization Bearer with Signed JWT ===");
  res = await makeRequest("https://food-api-team.noon.team/public/v1/pickup-points/list", {
    "Authorization": `Bearer ${jwt}`
  });
  console.log("Status:", res.status, JSON.stringify(res.data || res.raw));

  console.log("\n=== 3. Test X-API-KEY with Signed JWT ===");
  res = await makeRequest("https://food-api-team.noon.team/public/v1/pickup-points/list", {
    "X-API-KEY": jwt
  });
  console.log("Status:", res.status, JSON.stringify(res.data || res.raw));

  console.log("\n=== 4. Test OAuth Token Exchange at identity.noon.partners ===");
  res = await makeRequest("https://identity.noon.partners/oauth/token", {
    "Content-Type": "application/json"
  }, "POST", {
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt
  });
  console.log("Status:", res.status, JSON.stringify(res.data || res.raw));
}

testAllAuth();
