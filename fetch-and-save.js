// Run this with: node fetch-and-save.js
const fs = require('fs');

async function fetchAllChunks() {
  const baseUrl = 'https://functions.yandexcloud.net/d4e876drsbs7mmtsngot'; // save-git-file
  const chunkSize = 10000;
  let allContent = '';
  let chunkNum = 0;
  let hasMore = true;

  console.log('Fetching file from git commit 1e84b6d...\n');

  while (hasMore) {
    const url = `${baseUrl}?chunk=${chunkNum}&size=${chunkSize}`;
    console.log(`Fetching chunk ${chunkNum}...`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    allContent += data.chunk;
    hasMore = data.has_more;
    
    console.log(`  Chunk ${chunkNum}: ${data.start}-${data.end} / ${data.total_length} bytes`);
    console.log(`  Has more: ${hasMore}`);
    
    chunkNum++;
    
    if (chunkNum > 10) {
      console.error('Safety limit reached');
      break;
    }
  }

  console.log(`\nTotal content length: ${allContent.length} characters`);
  return allContent;
}

async function main() {
  try {
    const content = await fetchAllChunks();
    
    // Save to file
    fs.writeFileSync('ResultsStep.original.tsx', content, 'utf8');
    console.log('\n✅ File saved as: ResultsStep.original.tsx');
    
    // Also print first and last 500 chars for verification
    console.log('\n=== First 500 characters ===');
    console.log(content.substring(0, 500));
    console.log('\n=== Last 500 characters ===');
    console.log(content.substring(content.length - 500));
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
