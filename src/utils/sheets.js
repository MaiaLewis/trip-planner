export async function getOrCreateTripSheet(accessToken) {
  // First try to find the sheet
  console.log("getOrCreateTripSheet") 
  try {
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=name="Trip Planner Trips"&mimeType="application/vnd.google-apps.spreadsheet"',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    console.log("data", data)
    const tripSheet = data.files?.find(
      (sheet) => sheet.name === 'Trip Planner Trips'
    );

    if (tripSheet) {
      console.log("sheet exists")
      return tripSheet.id;
    }
    console.log("sheet does not exist")

    // If sheet doesn't exist, create it
    const createResponse = await fetch(
      'https://sheets.googleapis.com/v4/spreadsheets',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: 'Trip Planner Trips',
          },
          sheets: [
            {
              properties: {
                title: 'Trips',
              },
              data: [
                {
                  rowData: [
                    {
                      values: [
                        { userEnteredValue: { stringValue: 'Trip Name' } },
                        { userEnteredValue: { stringValue: 'Destination' } },
                        { userEnteredValue: { stringValue: 'Start Date' } },
                        { userEnteredValue: { stringValue: 'End Date' } },
                        { userEnteredValue: { stringValue: 'Created By' } },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      }
    );

    const createData = await createResponse.json();
    console.log("createData", createData)
    return createData.spreadsheetId;
  } catch (error) {
    console.error('Error setting up sheet:', error);
    throw error;
  }
}

export async function addTrip(accessToken, spreadsheetId, tripData) {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Trips:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[
            tripData.name,
            tripData.destination,
            tripData.startDate,
            tripData.endDate,
            tripData.createdBy,
          ]],
        }),
      }
    )

    return response.json()
  } catch (error) {
    console.error('Error adding trip:', error)
    throw error
  }
}

