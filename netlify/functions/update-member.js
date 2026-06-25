// netlify/functions/update-member.js
// Updates a member's status, selected image, or details via Sheet.best

const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Members';

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { email, status, selectedImage, name, role, skills } = body;

        // ✅ We identify members by email — it's always present and unique
        if (!email) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Member email is required' })
            };
        }

        // Build the update payload — only include fields that were sent
        const updates = {};
        if (status !== undefined)        updates.status = status;
        if (selectedImage !== undefined) updates.selectedImage = selectedImage;
        if (name !== undefined)          updates.name = name;
        if (role !== undefined)          updates.role = role;
        if (skills !== undefined)        updates.skills = skills;

        if (Object.keys(updates).length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No fields to update' })
            };
        }

        // ✅ Sheet.best filtered PATCH: /columnName/value
        // Finds all rows where email == the given email and patches only the sent fields
        const encodedEmail = encodeURIComponent(email.toLowerCase().trim());
        const url = `${SHEET_BEST_API}/email/${encodedEmail}`;

        console.log('PATCH URL:', url);
        console.log('Updates:', updates);

        const updateResponse = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        const responseText = await updateResponse.text();
        console.log(`Sheet.best response ${updateResponse.status}:`, responseText);

        if (!updateResponse.ok) {
            throw new Error(`Sheet.best responded with ${updateResponse.status}: ${responseText}`);
        }

        let result;
        try { result = JSON.parse(responseText); } catch { result = responseText; }

        // Sheet.best returns [] when no row matched the filter
        if (Array.isArray(result) && result.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Member not found in sheet' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Member updated successfully',
                updated: result
            })
        };
    } catch (error) {
        console.error('Update error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to update member: ' + error.message
            })
        };
    }
};
