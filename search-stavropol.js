// Script to search for Stavropol regions in Yandex Wordstat API
const https = require('https');

const url = 'https://functions.yandexcloud.net/d4er25nplih46mvmqkps';

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      
      // Results object
      const results = {
        stavropol_krai: null,
        stavropol_city: null,
        stavropol_city_parent: null,
        north_caucasus_district: null
      };
      
      // Function to recursively search regions
      function searchRegions(items, parent = null) {
        if (!items) return;
        
        for (const item of items) {
          const label = item.label || item.name || '';
          const value = item.value || item.id || '';
          
          // Check for Stavropol Krai
          if (label === 'Ставропольский край') {
            results.stavropol_krai = {
              id: value,
              label: label,
              parent: parent
            };
          }
          
          // Check for Stavropol City
          if (label === 'Ставрополь' && parent && parent.label === 'Ставропольский край') {
            results.stavropol_city = {
              id: value,
              label: label,
              parent_id: parent.value || parent.id
            };
            results.stavropol_city_parent = parent.value || parent.id;
          }
          
          // Check for North Caucasus Federal District
          if (label === 'Северо-Кавказский федеральный округ') {
            results.north_caucasus_district = {
              id: value,
              label: label
            };
          }
          
          // Recursively search in children
          if (item.children && item.children.length > 0) {
            searchRegions(item.children, item);
          }
        }
      }
      
      // Start search
      const regions = json.regions || json.data || json;
      searchRegions(regions);
      
      // Output results
      console.log('=== SEARCH RESULTS ===\n');
      
      console.log('1. Ставропольский край ID:', results.stavropol_krai?.id || 'NOT FOUND');
      
      console.log('2. Ставрополь city ID:', results.stavropol_city?.id || 'NOT FOUND');
      
      console.log('3. Parent region for Ставрополь city:', results.stavropol_city_parent || 'NOT FOUND');
      
      console.log('4. Северо-Кавказский федеральный округ ID:', results.north_caucasus_district?.id || 'NOT FOUND');
      
      console.log('\n=== DETAILED DATA ===');
      console.log(JSON.stringify(results, null, 2));
      
    } catch (error) {
      console.error('Error parsing JSON:', error.message);
      console.log('Raw response preview:', data.substring(0, 500));
    }
  });

}).on('error', (err) => {
  console.error('Error fetching data:', err.message);
});
