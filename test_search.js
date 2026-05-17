const fs = require('fs');
console.time('parse');
const data = JSON.parse(fs.readFileSync('public/countries+states+cities.json'));
console.timeEnd('parse');

function search(query) {
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  // Search logic: we want to find matching countries, states, cities
  for (const country of data) {
    if (country.name.toLowerCase().includes(lowerQuery)) {
      results.push({
        type: 'country',
        name: country.name,
        lat: country.latitude,
        lon: country.longitude
      });
      if (results.length > 10) break;
    }
    
    for (const state of country.states) {
      if (state.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'state',
          name: `${state.name}, ${country.name}`,
          lat: state.latitude,
          lon: state.longitude
        });
        if (results.length > 10) break;
      }
      
      for (const city of state.cities) {
        if (city.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'city',
            name: `${city.name}, ${state.name}, ${country.name}`,
            lat: city.latitude,
            lon: city.longitude
          });
          if (results.length > 10) break;
        }
      }
      if (results.length > 10) break;
    }
    if (results.length > 10) break;
  }
  return results;
}

console.time('search');
console.log(search('San Francisco'));
console.timeEnd('search');

console.time('search2');
console.log(search('Paris'));
console.timeEnd('search2');
