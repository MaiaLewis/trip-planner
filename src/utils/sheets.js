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

export async function addSurveyQuestion(accessToken, spreadsheetId, question, options = [], creator) {
  try {
    console.log('Adding survey question:', { question, options, creator });
    
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
        question,                    // A: Question
        options[0]?.label || '',     // B: Option label
        options[0]?.details || '',   // C: Option details
        options[0]?.link || '',      // D: Link URL
        options[0]?.image || '',     // E: Image URL
        '',                          // F: Voters (empty initially)
        creator                      // G: Creator
      ]
    ];

    // Only add additional rows if there are more options
    if (options.length > 1) {
      values.push(
        ...options.slice(1).map(option => [
          '',                         // A: Empty (no question)
          option?.label || '',        // B: Option label
          option?.details || '',      // C: Option details
          option?.link || '',         // D: Link URL
          option?.image || '',        // E: Image URL
          '',                         // F: Voters (empty initially)
          ''                          // G: Empty (no creator)
        ])
      );
    }

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

    if (!appendResponse.ok) {
      throw new Error(`Failed to append question: ${appendResponse.statusText}`);
    }

    const result = await appendResponse.json();
    console.log('Append response:', result);
    return result;
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

    // Toggle vote for the selected option
    const targetRow = questionStartRow + optionIndex;
    if (values[targetRow][5]) { // Column F (index 5) is for voters
      const voters = values[targetRow][5].split(',').map(v => v.trim());
      const hasVoted = voters.includes(userName);
      
      if (hasVoted) {
        // Remove vote
        values[targetRow][5] = voters.filter(v => v !== userName).join(',');
      } else {
        // Add vote
        values[targetRow][5] = voters.length > 0 ? `${values[targetRow][5]},${userName}` : userName;
      }
    } else {
      // First vote for this option
      values[targetRow][5] = userName;
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

export async function addNewQuestion(accessToken, spreadsheetId, questionData) {
  const { question, options = [], creator, index } = questionData; // Add default empty array
  
  try {
    console.log('Adding new question:', { question, options, creator, index });
    
    // If index exists, we're updating an existing question
    if (index !== undefined) {
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

      // Find the start row of the question we want to update
      let currentQuestionIndex = -1;
      let questionStartRow = 0;
      let nextQuestionRow = values.length;

      for (let i = 0; i < values.length; i++) {
        if (values[i][0]) {
          currentQuestionIndex++;
          if (currentQuestionIndex === index) {
            questionStartRow = i;
          } else if (currentQuestionIndex === index + 1) {
            nextQuestionRow = i;
            break;
          }
        }
      }

      // Create new values array for the question and its options
      const newValues = [
        [
          question,           // A: Question
          options[0]?.label || '',   // B: Option label
          options[0]?.details || '', // C: Option details
          options[0]?.link || '',    // D: Link URL
          options[0]?.image || '',   // E: Image URL
          options[0]?.voters?.join(',') || '',  // F: Voters
          creator            // G: Creator
        ],
        ...options.slice(1).map(option => [
          '',               // A: Empty (no question)
          option?.label || '',     // B: Option label
          option?.details || '', // C: Option details
          option?.link || '',    // D: Link URL
          option?.image || '',   // E: Image URL
          option?.voters?.join(',') || '', // F: Voters
          ''               // G: Empty (no creator)
        ])
      ];

      // Calculate the range based on the number of rows we're updating
      const numRows = newValues.length;
      const startRow = questionStartRow + 1; // +1 because Sheets is 1-based
      const endRow = startRow + numRows - 1;

      // Update the range
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Survey!A${startRow}:G${endRow}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: newValues,
            range: `Survey!A${startRow}:G${endRow}` // Add explicit range in the body
          }),
        }
      );

      return true;
    }
    
    // Otherwise add new question
    const result = await addSurveyQuestion(
      accessToken,
      spreadsheetId,
      question,
      options || [], // Ensure options is an array
      creator
    );
    console.log('Add question result:', result);
    return result;
  } catch (error) {
    console.error('Error in addNewQuestion:', error);
    throw error;
  }
}

