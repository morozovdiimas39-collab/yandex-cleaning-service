const url = 'https://functions.poehali.dev/2642bac6-6d47-4fda-86e9-a10c458a2d81';

const requestBody = {
  batch_id: 83,
  project_id: 142,
  campaign_ids: ["116683139"],
  yandex_token: "y0__xDRjcKfBxi6pjsg17GM_BQwzZmAiAh8NW9LWW3r_9NQhK9ofTSPKARdpg"
};

async function callBatchWorker() {
  try {
    console.log('Sending POST request to:', url);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('\n---\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('\nResponse JSON:');
      console.log(JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log('\nResponse (not JSON):');
      console.log(responseText);
    }
  } catch (error) {
    console.error('Error making request:', error);
  }
}

callBatchWorker();
