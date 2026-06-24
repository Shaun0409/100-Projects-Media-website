// netlify/functions/upload-media-kit.js
// Manages media kit via mediakit.json

const fs = require('fs');
const path = require('path');

const MEDIAKIT_FILE = path.join(__dirname, '..', '..', 'mediakit.json');

function readMediaKit() {
    try {
        if (fs.existsSync(MEDIAKIT_FILE)) {
            const data = fs.readFileSync(MEDIAKIT_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading media kit file:', error);
    }
    return { url: '' };
}

function writeMediaKit(data) {
    try {
        fs.writeFileSync(MEDIAKIT_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing media kit file:', error);
        return false;
    }
}

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    // GET - fetch media kit URL
    if (event.httpMethod === 'GET') {
        try {
            const data = readMediaKit();
            if (data.url) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, url: data.url })
                };
            } else {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Media Kit not found' })
                };
            }
        } catch (error) {
            console.error('GET media kit error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to fetch media kit' })
            };
        }
    }

    // POST - update media kit URL
    if (event.httpMethod === 'POST') {
        try {
            const { url } = JSON.parse(event.body);

            if (!url) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'URL is required' })
                };
            }

            // Validate URL
            try {
                new URL(url);
            } catch (e) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid URL format' })
                };
            }

            const mediaKitData = readMediaKit();
            mediaKitData.url = url;
            writeMediaKit(mediaKitData);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Media Kit URL saved successfully!',
                    url: url
                })
            };
        } catch (error) {
            console.error('POST media kit error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to save media kit: ' + error.message })
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};