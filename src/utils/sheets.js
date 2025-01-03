export async function getTrips(accessToken) {
  try {
    // First get owned trips
    const ownedResponse = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=name contains "Trip Planner" and mimeType="application/vnd.google-apps.spreadsheet"&fields=files(id,name,owners,permissions)',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Then get shared trips
    const sharedResponse = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.spreadsheet" and sharedWithMe&fields=files(id,name,owners,permissions)',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const [ownedData, sharedData] = await Promise.all([
      ownedResponse.json(),
      sharedResponse.json()
    ]);

    const processTrip = (file, isOwner) => {
      const owner = file.owners?.[0] || null;
      const sharedWith = file.permissions
        ?.filter(p => p.role === 'writer' && p.type === 'user' && p.emailAddress !== owner.emailAddress)
        .map(p => ({
          email: p.emailAddress,
          name: p.displayName || p.emailAddress,
          image: `https://www.googleapis.com/drive/v3/files/${p.photoLink || ''}`
        })) || [];

      return {
        id: file.id,
        name: file.name.replace('Trip Planner - ', ''),
        isOwner,
        owner: owner ? {
          email: owner.emailAddress,
          name: owner.displayName || owner.emailAddress,
          image: owner.photoLink
        } : null,
        sharedWith
      };
    };

    const ownedTrips = ownedData.files
      .filter(file => file.name.startsWith('Trip Planner - '))
      .map(file => processTrip(file, true));

    const sharedTrips = sharedData.files
      .filter(file => file.name.startsWith('Trip Planner - '))
      .map(file => processTrip(file, false));

    return [...ownedTrips, ...sharedTrips];
  } catch (error) {
    console.error('Error getting trips:', error);
    throw error;
  }
}

export async function addTrip(accessToken, tripData) {
  try {
    const response = await fetch(
      'https://sheets.googleapis.com/v4/spreadsheets',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: `Trip Planner - ${tripData.name}`,
          },
          sheets: [
            {
              properties: {
                title: 'Details'
              }
            },
            {
              properties: {
                title: 'Survey'
              }
            }
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create spreadsheet: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error creating trip spreadsheet:', error);
    throw error;
  }
}

export async function addSurveyQuestion(accessToken, spreadsheetId, question, options, creator) {
  try {
    // First check if the Survey sheet exists
    const getResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!getResponse.ok) {
      throw new Error(`Failed to get spreadsheet: ${getResponse.statusText}`);
    }

    const spreadsheet = await getResponse.json();
    const surveySheetExists = spreadsheet.sheets?.some(
      sheet => sheet.properties.title === 'Survey'
    );

    // Create Survey sheet if it doesn't exist
    if (!surveySheetExists) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [{
              addSheet: {
                properties: {
                  title: 'Survey'
                }
              }
            }]
          }),
        }
      );
    }

    // Format the data with all columns
    const values = [
      [
        question,           // A: Question
        options[0].label,   // B: Option label
        options[0].details || '', // C: Option details
        options[0].link || '',    // D: Link URL
        options[0].image || '',   // E: Image URL
        '',                       // F: Voters (empty initially)
        creator                   // G: Creator
      ],
      ...options.slice(1).map(option => [
        '',                      // A: Empty (no question)
        option.label,            // B: Option label
        option.details || '',    // C: Option details
        option.link || '',       // D: Link URL
        option.image || '',      // E: Image URL
        '',                      // F: Voters (empty initially)
        ''                       // G: Empty (no creator)
      ])
    ];

    // Then append the question and options
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Survey:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        }),
      }
    );

    return appendResponse.json();
  } catch (error) {
    console.error('Error adding survey question:', error);
    throw error;
  }
}

export async function getSurveyQuestions(accessToken, spreadsheetId) {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Survey`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get questions: ${response.statusText}`);
    }

    const data = await response.json();
    const questions = [];
    let currentQuestion = null;

    // Process the rows to group options and voters by question
    data.values?.forEach(row => {
      if (row[0]) { // This is a question row
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          question: row[0],
          creator: row[6] || null, // Creator moved to column G
          options: [{
            label: row[1],
            details: row[2] || null,
            link: row[3] || null,
            image: row[4] || null,
            voters: row[5] ? row[5].split(',').map(voter => voter.trim()) : []
          }]
        };
      } else if (row[1] && currentQuestion) { // This is an option row
        currentQuestion.options.push({
          label: row[1],
          details: row[2] || null,
          link: row[3] || null,
          image: row[4] || null,
          voters: row[5] ? row[5].split(',').map(voter => voter.trim()) : []
        });
      }
    });

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions;
  } catch (error) {
    console.error('Error getting survey questions:', error);
    throw error;
  }
}

export async function addTripCollaborator(accessToken, spreadsheetId, email) {
  try {
    // First check if 'Collaborators' sheet exists
    const getResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const spreadsheet = await getResponse.json();
    const collaboratorsSheetExists = spreadsheet.sheets?.some(
      sheet => sheet.properties.title === 'Collaborators'
    );

    // Create Collaborators sheet if it doesn't exist
    if (!collaboratorsSheetExists) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [{
              addSheet: {
                properties: {
                  title: 'Collaborators'
                }
              }
            }]
          }),
        }
      );
    }

    // Add the collaborator
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Collaborators:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[email]]
        }),
      }
    );

    // Share the spreadsheet with the user
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'writer',
          type: 'user',
          emailAddress: email
        }),
      }
    );

    return true;
  } catch (error) {
    console.error('Error adding collaborator:', error);
    throw error;
  }
}

export async function updateVote(accessToken, spreadsheetId, questionIndex, optionIndex, userName) {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Survey`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    const values = data.values || [];

    let currentQuestionIndex = -1;
    let questionStartRow = 0;

    for (let i = 0; i < values.length; i++) {
      if (values[i][0]) {
        currentQuestionIndex++;
        if (currentQuestionIndex === questionIndex) {
          questionStartRow = i;
          break;
        }
      }
    }

    // Remove voter from all options in this question
    let currentRow = questionStartRow;
    while (currentRow < values.length && (!values[currentRow + 1]?.[0])) {
      if (values[currentRow][5]) { // Column F (index 5) is now for voters
        const voters = values[currentRow][5].split(',').map(v => v.trim());
        values[currentRow][5] = voters.filter(v => v !== userName).join(',');
      }
      currentRow++;
    }

    // Add voter to selected option
    const targetRow = questionStartRow + optionIndex;
    if (!values[targetRow][5] || values[targetRow][5] === '') {
      values[targetRow][5] = userName;
    } else {
      values[targetRow][5] = `${values[targetRow][5]},${userName}`;
    }

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Survey!A1:G${values.length}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        }),
      }
    );

    return true;
  } catch (error) {
    console.error('Error updating vote:', error);
    throw error;
  }
}

