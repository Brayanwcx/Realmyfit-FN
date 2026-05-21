const fs = require('fs');
const path = require('path');

async function test() {
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:3005/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@admin.com', password: 'admin' })
    });
    
    if (!loginRes.ok) throw new Error('Login failed: ' + await loginRes.text());
    
    const { access_token } = await loginRes.json();
    console.log('Got token:', access_token.substring(0, 10) + '...');

    // 2. Create dummy file
    const filePath = path.join(__dirname, 'dummy.txt');
    fs.writeFileSync(filePath, 'hello world');

    // 3. Upload file using FormData equivalent in Node
    console.log('Uploading file...');
    const fileContent = fs.readFileSync(filePath);
    
    // Manual multipart/form-data payload for dummy.txt
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    let data = '';
    data += '--' + boundary + '\r\n';
    data += 'Content-Disposition: form-data; name="file"; filename="dummy.txt"\r\n';
    data += 'Content-Type: text/plain\r\n\r\n';
    data += 'hello world\r\n';
    data += '--' + boundary + '--\r\n';

    const uploadRes = await fetch('http://localhost:3005/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: data
    });

    if (!uploadRes.ok) throw new Error('Upload failed: ' + uploadRes.status + ' ' + await uploadRes.text());
    
    const uploadData = await uploadRes.json();
    console.log('Upload success:', uploadData);

  } catch (err) {
    console.error(err);
  }
}

test();
