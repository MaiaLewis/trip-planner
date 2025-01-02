export async function getTrips(accessToken) {
  try {
    // First get owned trips
    const ownedResponse = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=name contains "Trip Planner" and mimeType="application/vnd.google-apps.spreadsheet"',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Then get shared trips
    const sharedResponse = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.spreadsheet" and sharedWithMe',
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

    const ownedTrips = ownedData.files
      .filter(file => file.name.startsWith('Trip Planner - '))
      .map(file => ({
        id: file.id,
        name: file.name.replace('Trip Planner - ', ''),
        isOwner: true
      }));

    const sharedTrips = sharedData.files
      .filter(file => file.name.startsWith('Trip Planner - '))
      .map(file => ({
        id: file.id,
        name: file.name.replace('Trip Planner - ', ''),
        isOwner: false
      }));

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
            },
            {
              properties: {
                title: 'Collaborators'
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

export async function addSurveyQuestion(accessToken, spreadsheetId, question, options) {
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

    // Format the data with question in first column and options in second column
    const values = [
      [question, options[0], ''], // First row has question and first option
      ...options.slice(1).map(option => ['', option, '']) // Subsequent rows have just the options
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
          options: [{
            text: row[1],
            voters: row[2] ? row[2].split(',').map(email => email.trim()) : []
          }]
        };
      } else if (row[1] && currentQuestion) { // This is an option row
        currentQuestion.options.push({
          text: row[1],
          voters: row[2] ? row[2].split(',').map(email => email.trim()) : []
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
      if (values[currentRow][2]) {
        const voters = values[currentRow][2].split(',').map(v => v.trim());
        values[currentRow][2] = voters.filter(v => v !== userName).join(',');
      }
      currentRow++;
    }

    // Add voter to selected option
    const targetRow = questionStartRow + optionIndex;
    if (!values[targetRow][2] || values[targetRow][2] === '') {
      values[targetRow][2] = userName;
    } else {
      values[targetRow][2] = `${values[targetRow][2]},${userName}`;
    }

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Survey!A1:D${values.length}?valueInputOption=RAW`,
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

