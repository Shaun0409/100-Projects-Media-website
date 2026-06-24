// netlify/functions/upload-media-kit.js
// Uploads a PDF file to the server

const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        // Parse the form data using a simpler approach
        const body = event.body;
        const contentType = event.headers['content-type'] || '';
        const boundary = contentType.split('boundary=')[1];

        if (!boundary) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid form data' }) };
        }

        // Split the body by boundary
        const parts = body.split(`--${boundary}`);
        let fileData = '';
        let fileFound = false;

        for (const part of parts) {
            // Look for filename in the part
            if (part.includes('filename=')) {
                // Extract the content (everything after the first empty line)
                const lines = part.split('\n');
                let inContent = false;
                let content = '';
                
                for (const line of lines) {
                    if (line.trim() === '') {
                        inContent = true;
                        continue;
                    }
                    if (inContent) {
                        content += line + '\n';
                    }
                }
                
                // Clean up the content
                content = content.trim();
                if (content.length > 0) {
                    fileData = content;
                    fileFound = true;
                    break;
                }
            }
        }

        if (!fileFound || !fileData) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: 'No file uploaded or file is empty. Please select a valid PDF file.' }) 
            };
        }

        // Determine file path
        const filePath = path.join(__dirname, '..', '..', 'media-kit.pdf');
        
        // Write the file
        fs.writeFileSync(filePath, fileData, 'base64');

        // Verify file was written
        if (!fs.existsSync(filePath)) {
            throw new Error('Failed to write file');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'Media Kit uploaded successfully!',
                path: '/media-kit.pdf'
            })
        };

    } catch (error) {
        console.error('Upload error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to upload file: ' + error.message 
            })
        };
    }
};