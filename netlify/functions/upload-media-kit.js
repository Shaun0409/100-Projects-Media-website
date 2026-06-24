// netlify/functions/upload-media-kit.js
// Manages media kit via Google Apps Script API

const API_BASE = 'https://script.google.com/macros/s/AKfycbzr0Z1TpP1VzkUOTwM39ef49bdL8Fspj9V7QPROuG0tDYwGB7mS7-__V8OfFx6fDKt2KQ/exec';

exports.handler = async function(event, context) {
    // GET - fetch media kit URL
    if (event.httpMethod === 'GET') {
        try {
            const response = await fetch(`${API_BASE}?action=getMediaKit`);
            const data = await response.json();
            
            if (data.url) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ success: true, url: data.url })
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'Media Kit not found' })
                };
            }
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch media kit' })
            };
        }
    }

    // POST - update media kit URL
    if (event.httpMethod === 'POST') {
        try {
            const data = JSON.parse(event.body);
            const { url } = data;

            if (!url) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'URL is required' })
                };
            }

            // Validate URL
            try {
                new URL(url);
            } catch (e) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid URL format' })
                };
            }

            const response = await fetch(`${API_BASE}?action=updateMediaKit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const result = await response.json();

            if (result.error) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: result.error })
                };
            }

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'Media Kit URL saved successfully!',
                    url: url
                })
            };
        } catch (error) {
            console.error('Media kit error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to save media kit: ' + error.message })
            };
        }
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};