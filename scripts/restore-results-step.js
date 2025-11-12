// Script to restore ResultsStep.tsx from git commit 1e84b6d
const fs = require('fs');
const path = require('path');

async function fetchAllChunks() {
  const baseUrl = 'https://functions.poehali.dev/7f65b331-870f-4c66-97be-92631d0c8200';
  const chunkSize = 10000;
  let allContent = '';
  let chunkNum = 0;
  let hasMore = true;

  console.log('Fetching file from git commit 1e84b6d...');

  while (hasMore) {
    const url = `${baseUrl}?chunk=${chunkNum}&size=${chunkSize}`;
    console.log(`Fetching chunk ${chunkNum}...`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    allContent += data.chunk;
    hasMore = data.has_more;
    chunkNum++;
    
    console.log(`  Progress: ${data.end}/${data.total_length} bytes`);
  }

  console.log(`\nTotal length: ${allContent.length} characters`);
  return allContent;
}

async function main() {
  try {
    const content = await fetchAllChunks();
    
    const outputPath = path.join(__dirname, '..', 'src', 'components', 'clustering', 'ResultsStep.original.tsx');
    fs.writeFileSync(outputPath, content, 'utf8');
    
    console.log(`\nFile saved to: ${outputPath}`);
    console.log('Original ResultsStep.tsx from commit 1e84b6d has been restored!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
