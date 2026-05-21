const fs = require('fs');
const path = require('path');

async function test() {
  try {
    // Create dummy file
    const filePath = path.join(__dirname, 'dummy.txt');
    fs.writeFileSync(filePath, 'hello world');

    // Upload file using FormData equivalent in Node
    console.log('Uploading file...');
    
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
