// netlify/functions/upload-media-kit.js
// Note: Netlify Functions have a 6MB payload limit

const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        // Parse multipart form data
        const contentType = event.headers['content-type'] || '';
        const boundary = contentType.split('boundary=')[1];
        
        if (!boundary) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid form data' }) };
        }

        const body = event.body;
        const parts = body.split(`--${boundary}`);

        let fileData = '';
        let fileFound = false;

        for (const part of parts) {
            if (part.includes('filename=')) {
                const lines = part.split('\r\n');
                let contentStart = false;
                let contentLines = [];
                
                for (const line of lines) {
                    if (line === '') {
                        contentStart = true;
                        continue;
                    }
                    if (contentStart && !line.includes('filename=') && !line.includes('Content-Type') && !line.includes('Content-Disposition')) {
                        contentLines.push(line);
                    }
                }
                
                const content = contentLines.join('');
                const cleanContent = content.replace(/--$/, '').trim();
                if (cleanContent) {
                    fileData = cleanContent;
                    fileFound = true;
                    break;
                }
            }
        }

        if (!fileFound || !fileData) {
            return { statusCode: 400, body: JSON.stringify({ error: 'No file uploaded or file is empty' }) };
        }

        // Write the file
        const filePath = path.join(__dirname, '..', '..', 'media-kit.pdf');
        fs.writeFileSync(filePath, fileData, 'base64');

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Media Kit uploaded successfully' })
        };

    } catch (error) {
        console.error('Upload error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to upload file: ' + error.message })
        };
    }
};