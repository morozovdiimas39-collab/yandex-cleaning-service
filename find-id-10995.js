const https = require('https');

https.get('https://functions.poehali.dev/6e6f4963-53eb-43b1-a048-822b807a734b', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const json = JSON.parse(data);
    
    function findById(node, targetId, path = []) {
      const currentPath = [...path, { id: node.value, name: node.label }];
      
      if (node.value === targetId) {
        console.log(`\n✅ НАЙДЕН ID ${targetId}:`);
        console.log('   Название:', node.label);
        console.log('   Полный путь:', currentPath.map(p => `${p.name} (${p.id})`).join(' → '));
        return true;
      }
      
      if (node.children) {
        for (const child of node.children) {
          if (findById(child, targetId, currentPath)) {
            return true;
          }
        }
      }
      return false;
    }
    
    console.log('🔍 Ищем ID 10995...');
    json.regions.forEach(region => findById(region, '10995'));
    
    console.log('\n🔍 Ищем ID 11004...');
    json.regions.forEach(region => findById(region, '11004'));
  });
}).on('error', (err) => {
  console.error('Ошибка:', err.message);
});
