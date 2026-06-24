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
        return { logos: [] };
    }
    return { logos: [] };
}

function writePartners(data) {
    try {
        fs.writeFileSync(PARTNERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        return false;
    }
}

exports.handler = async function(event, context) {
    if (event.httpMethod === 'GET') {
        try {
            const data = readPartners();
            return { statusCode: 200, body: JSON.stringify(data) };
        } catch (error) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to read partners' }) };
        }
    }
    if (event.httpMethod === 'POST') {
        try {
            const data = JSON.parse(event.body);
            const { url, name } = data;
            if (!url || !name) {
                return { statusCode: 400, body: JSON.stringify({ error: 'URL and name are required' }) };
            }
            const partnersData = readPartners();
            partnersData.logos.push({ id: Date.now(), url, name });
            writePartners(partnersData);
            return { statusCode: 200, body: JSON.stringify({ success: true, logos: partnersData.logos }) };
        } catch (error) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to add partner' }) };
        }
    }
    if (event.httpMethod === 'DELETE') {
        try {
            const data = JSON.parse(event.body);
            const { id } = data;
            if (!id) {
                return { statusCode: 400, body: JSON.stringify({ error: 'ID is required' }) };
            }
            const partnersData = readPartners();
            partnersData.logos = partnersData.logos.filter(l => l.id !== id);
            writePartners(partnersData);
            return { statusCode: 200, body: JSON.stringify({ success: true, logos: partnersData.logos }) };
        } catch (error) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to delete partner' }) };
        }
    }
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};