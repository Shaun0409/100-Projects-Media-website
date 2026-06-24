// netlify/functions/signup.js
// Uses Sheet.best API to store members in Google Sheets

// Replace with your Sheet.best connection URL
const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/ea89e6d2-3087-4506-ab5b-31e9802bcd62';

// Default owners (for counting)
const OWNER_COUNT = 3;

async function getMemberCount() {
    try {
        const response = await fetch(SHEET_BEST_API);
        if (response.ok) {
            const data = await response.json();
            // Total count = owners (3) + members from sheet
            return (data || []).length + OWNER_COUNT;
        }
        return OWNER_COUNT;
    } catch (error) {
        return OWNER_COUNT;
    }
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { name, email, role, message } = JSON.parse(event.body);

        if (!name || !email || !role) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Name, email, and role are required' })
            };
        }

        // Check if email already exists (including owners)
        const checkResponse = await fetch(SHEET_BEST_API);
        if (checkResponse.ok) {
            const existingMembers = await checkResponse.json();
            const emailExists = existingMembers.some(m => m.email === email);
            // Also check against owners
            const ownerEmails = ['khocypixs@gmail.com', 'mpilo1@gmail.com'];
            if (ownerEmails.includes(email) || emailExists) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'This email is already registered.' })
                };
            }
        }

        // Check if at 100 members
        const currentCount = await getMemberCount();
        if (currentCount >= 100) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Community is full! We\'ve reached 100 members.' })
            };
        }

        // Save to Google Sheets via Sheet.best
        const response = await fetch(SHEET_BEST_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                name: name,
                email: email,
                role: role,
                message: message || ''
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save to Google Sheets');
        }

        const newCount = await getMemberCount();

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                count: newCount,
                message: 'Successfully joined the community!'
            })
        };

    } catch (error) {
        console.error('Signup error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to save member data: ' + error.message })
        };
    }
};