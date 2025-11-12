// Script to fetch Wordstat regions
const https = require('https');

const url = 'https://functions.poehali.dev/8b141446-430c-4c0b-b347-a0a2057c0ee8';

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      
      // Target regions to find
      const targetRegions = [
        'Россия',
        'Москва',
        'Москва и область',
        'Санкт-Петербург',
        'Санкт-Петербург и область',
        'Новосибирск',
        'Екатеринбург',
        'Казань',
        'Нижний Новгород',
        'Краснодар',
        'Ставрополь',
        'Ростов-на-Дону',
        'Владивосток',
        'Самара',
        'Омск',
        'Челябинск',
        'Уфа'
      ];
      
      // Function to recursively search regions
      function findRegions(regions, targetNames) {
        const results = [];
        
        function search(items) {
          if (!items) return;
          
          for (const item of items) {
            if (targetNames.includes(item.name)) {
              results.push({ id: String(item.id), name: item.name });
            }
            
            // Recursively search in children
            if (item.children && item.children.length > 0) {
              search(item.children);
            }
          }
        }
        
        search(regions);
        return results;
      }
      
      const found = findRegions(json.data || json.regions || json, targetRegions);
      
      // Sort by the order in targetRegions
      const sorted = targetRegions
        .map(name => found.find(r => r.name === name))
        .filter(r => r !== undefined);
      
      console.log(JSON.stringify(sorted, null, 2));
      
    } catch (error) {
      console.error('Error parsing JSON:', error.message);
      console.log('Raw response:', data);
    }
  });

}).on('error', (err) => {
  console.error('Error fetching data:', err.message);
});
