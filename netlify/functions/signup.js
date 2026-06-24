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
        return { members: [], count: 3 };
    }
    return { members: [], count: 3 };
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
        const { name, email, role, message } = data;
        if (!name || !email || !role) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Name, email, and role are required' }) };
        }
        const membersData = readMembers();
        if (membersData.count >= 100) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Community is full!' }) };
        }
        const existingMember = membersData.members.find(m => m.email === email);
        if (existingMember) {
            return { statusCode: 400, body: JSON.stringify({ error: 'This email is already registered.' }) };
        }
        const newMember = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            name: name,
            email: email,
            role: role,
            message: message || ''
        };
        membersData.members.push(newMember);
        membersData.count += 1;
        const saved = writeMembers(membersData);
        if (!saved) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save member data' }) };
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, count: membersData.count })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
    }
};