const xlsx = require('xlsx');
const https = require('https');

function getURL(url) {
    let buf = '';
    return new Promise(resolve => {
        https.get(url, res => {
            res.on('data', chunk => buf += chunk);
            res.on('end', () => {
                let data = JSON.parse(buf);
                resolve(data);
            });
            res.on('error', e => {
                console.error(e);
                resolve(e);
            });
        });
    });
}

function parseXLSX(uri) {
    let file = xlsx.readFile(uri);
    let sheet_name_list = file.SheetNames;
    return xlsx.utils.sheet_to_json(file.Sheets[sheet_name_list[0]]);
}

function getState(state) {
    let ret = [];
    origin.forEach(e => {if(e.State == state) ret.push(e)});
    if(!ret) console.log('No results found. Please make sure you are using the correct two-letter state code.');
    return ret;
}

function getIndex(provider) {
    let url = provider['URL Submitted'] || '';
    return new Promise(resolve => resolve(getURL(url).then(data => {return data})));
}

function getProviderPage(index, page) {
    let url = index.provider_urls[page] || '';
    if(url) return getURL(url);
    else throw 'ERROR: PROVIDER URL NOT FOUND';
}

function searchByName(company, query) {
    return new Promise(resolve => {
        getIndex(company).then(index => {
            resolve(getProviderPage(index, 0).then(list => {
                return list.filter(prov => {
                    if(prov.name)
                        return prov.name.first == query.name.first && prov.name.last == query.name.last;
                    else return false;
                }) || 'No results found';
            }));
        });
    })
}
function searchByNPI(company, query) {
    return new Promise(resolve => {
        getIndex(company).then(index => {
            resolve(getProviderPage(index, 0).then(list => {
                return list.filter(prov => {
                    if(prov.npi)
                        return prov.npi == (typeof(query.npi) === 'string' ? query.npi : query.npi.toString());
                    else return false;
                });
            }));
        });
    })
}
function providerSearch(company, query, options={param: 'npi'}){
    switch(options.param) {
        case 'npi': return query.npi ? searchByNPI(company, query) : Promise.resolve(new Error('ERROR: Query not valid'));
        case 'name': return query.name ? searchByName(company, query) : Promise.resolve(new Error('ERROR: Query not valid'));
        default: return Promise.resolve(new Error('ERROR: Search parameter not supported.'));
    }
}

const origin = parseXLSX('./res/origin.xlsx');
const flInsurance = getState('FL');
const humana = flInsurance[1];
const humanaIndex = getIndex(humana);

//console.dir(humanaIndex);
humanaIndex.then(data => getProviderPage(data, 0).then(provs => console.dir(provs.length)));
// searchByName(humana, {name: {first: 'Cindi', last: 'Rule'}}).then(result => console.dir(result));
// searchByNPI(humana, {npi: 1003006610}).then(result => console.dir(result));
// providerSearch(humana, {npi: '1003006610'}).then(result => console.dir(result));
// providerSearch(humana, {name: {first: 'Cindi', last: 'Rule'}}, {param: 'x'}).then(result => console.dir(result));
//humanaIndex.then(p => console.dir(p));