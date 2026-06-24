const fs = require('fs');
const path = require('path');
const MEMBERS_FILE = path.join(__dirname, '..', '..', 'members.json');

function readMembers() {
    try {
        if (fs.existsSync(MEMBERS_FILE)) {
            const data = fs.readFileSync(MEMBERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        return { members: [], count: 0 };
    }
    return { members: [], count: 0 };
}

function writeMembers(data) {
    try {
        fs.writeFileSync(MEMBERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        return false;
    }
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
    try {
        const data = JSON.parse(event.body);
        const membersData = readMembers();
        if (data.deleteAll) {
            membersData.members = [];
            membersData.count = 0;
            writeMembers(membersData);
            return { statusCode: 200, body: JSON.stringify({ success: true }) };
        }
        const { id } = data;
        if (!id) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Member ID is required' }) };
        }
        membersData.members = membersData.members.filter(m => m.id !== parseInt(id));
        membersData.count = membersData.members.length;
        writeMembers(membersData);
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
    }
};