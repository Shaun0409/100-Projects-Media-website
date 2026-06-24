// netlify/functions/partners.js
// Manages partner logos

const fs = require('fs');
const path = require('path');
const PARTNERS_FILE = path.join(__dirname, '..', '..', 'partners.json');

function readPartners() {
    try {
        if (fs.existsSync(PARTNERS_FILE)) {
            const data = fs.readFileSync(PARTNERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading partners file:', error);
    }
    return { logos: [] };
}

function writePartners(data) {
    try {
        fs.writeFileSync(PARTNERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing partners file:', error);
        return false;
    }
}

exports.handler = async function(event, context) {
    // GET - fetch all partners
    if (event.httpMethod === 'GET') {
        try {
            const data = readPartners();
            return {
                statusCode: 200,
                body: JSON.stringify(data)
            };
        } catch (error) {
            return {
                statusCode: 200,
                body: JSON.stringify({ logos: [] })
            };
        }
    }

    // POST - add a new partner
    if (event.httpMethod === 'POST') {
        try {
            const data = JSON.parse(event.body);
            const { url, name } = data;

            if (!url || !name) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'URL and name are required' })
                };
            }

            const partnersData = readPartners();
            partnersData.logos.push({ 
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                url: url,
                name: name
            });
            writePartners(partnersData);

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, logos: partnersData.logos })
            };
        } catch (error) {
            console.error('Add partner error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to add partner: ' + error.message })
            };
        }
    }

    // DELETE - remove a partner
    if (event.httpMethod === 'DELETE') {
        try {
            const data = JSON.parse(event.body);
            const { id } = data;

            if (!id) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'ID is required' })
                };
            }

            const partnersData = readPartners();
            const initialLength = partnersData.logos.length;
            partnersData.logos = partnersData.logos.filter(l => l.id !== id);
            
            if (partnersData.logos.length === initialLength) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'Partner not found' })
                };
            }
            
            writePartners(partnersData);

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, logos: partnersData.logos })
            };
        } catch (error) {
            console.error('Delete partner error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to delete partner: ' + error.message })
            };
        }
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};