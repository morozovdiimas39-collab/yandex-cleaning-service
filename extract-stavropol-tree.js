const https = require('https');

https.get('', (res) => { //https://functions.poehali.dev/6e6f4963-53eb-43b1-a048-822b807a734b
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    
    function findInTree(items, path = []) {
      for (const item of items || []) {
        const currentPath = [...path, { value: item.value, label: item.label }];
        
        if (item.label === 'Ставропольский край') {
          console.log('\n=== FOUND: Ставропольский край ===');
          console.log('Path from root:', currentPath.map(p => `${p.label} (${p.value})`).join(' → '));
          console.log('\nFull JSON:');
          console.log(JSON.stringify(item, null, 2));
          
          // Find Stavropol city in children
          const city = item.children?.find(c => c.label === 'Ставрополь');
          if (city) {
            console.log('\n=== FOUND: Ставрополь City ===');
            console.log('City ID:', city.value);
            console.log('Parent ID:', item.value);
            console.log('Full JSON:', JSON.stringify(city, null, 2));
          }
        }
        
        if (item.children) findInTree(item.children, currentPath);
      }
    }
    
    findInTree(json.regions);
  });
}).on('error', console.error);
