// netlify/functions/partners.js
// Fetches partner logos from Cloudinary

// Replace with your Cloudinary cloud name
const CLOUDINARY_CLOUD_NAME = 'ddks5csyg';
const CLOUDINARY_FOLDER = 'partners';

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Fetch images from Cloudinary
        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image/upload/${CLOUDINARY_FOLDER}`;
        const response = await fetch(url);

        // If Cloudinary returns an error, return empty array (not 500)
        if (!response.ok) {
            console.log('Cloudinary error:', response.status);
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    logos: [],
                    message: 'No partners added yet. Upload logos to Cloudinary.'
                })
            };
        }

        const data = await response.json();
        
        // Format the response
        const logos = (data.resources || []).map(img => ({
            id: img.public_id,
            name: img.public_id.split('/').pop().replace(/[_-]/g, ' ').replace(/\.[^/.]+$/, ''),
            url: img.secure_url
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({ logos })
        };

    } catch (error) {
        console.error('Partners error:', error);
        // Return empty array instead of 500
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                logos: [],
                message: 'Could not fetch partners'
            })
        };
    }
};