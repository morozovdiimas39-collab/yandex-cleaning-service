// Script to fetch all regions from Yandex API and generate TypeScript file

const fs = require('fs');
const https = require('https');

const url = 'https://functions.poehali.dev/6e6f4963-53eb-43b1-a048-822b807a734b';

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const json = JSON.parse(data);
    const regions = json.regions;
    
    console.log(`Total regions fetched: ${regions.length}`);
    
    // Generate TypeScript file content
    let content = `// ✅ Все ID из официального API Яндекс.Wordstat (getRegionsTree)
// Дата обновления: 2025-11-09

export interface City {
  id: number;
  name: string;
  population?: number;
  region?: string;
}

export const RUSSIAN_CITIES: City[] = [
`;
    
    // Add all regions
    regions.forEach((region, index) => {
      const comma = index < regions.length - 1 ? ',' : '';
      content += `  { id: ${region.id}, name: "${region.name}" }${comma}\n`;
    });
    
    content += '];\n';
    
    // Write to file
    fs.writeFileSync('src/data/russian-cities.ts', content, 'utf8');
    console.log('File written successfully to src/data/russian-cities.ts');
    console.log(`Total entries: ${regions.length}`);
  });
}).on('error', (err) => {
  console.error('Error fetching data:', err.message);
});
