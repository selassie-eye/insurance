const http = require('http');
const search = require('./search.js');

const baseUrl = 'http://localhost:3002/search';
const detailsUrl = 'http://localhost:3002/details';

var query = '?';
const loc = 'location=29.6478,-82.33784';
const rankBy = 'rankby=distance';
const keyword = 'keyword=heart';
const type = 'type=doctor'
query += `${loc}&${rankBy}&${keyword}&${type}`;

const url = baseUrl + query;
console.log('URL: ' + url);

var buf = '';
var testReq = new Promise((resolve, reject) => {
    http.get(url, res => {
        res.on('data', chunk => buf += chunk);
        res.on('end', () => {
            let data = JSON.parse(buf);
            resolve(data);
        });
        res.on('error', e => {
            console.error(e);
            reject(e);
        });
    });
});

var detailsReq = (page, index) => {
    // search.printHeader('begin-detailsreq');
    let name = page[index].name || '';
    let id = page[index].place_id || '';
    let buf = '';
    console.log(page[index].name ? `Requesting details for ${name}...` : 'Result not found.');
    let uri = detailsUrl + `?placeid=${id}`; 
    console.log('URL: ' + uri);
    return new Promise((resolve, reject) => {
        http.get(uri, res => {
            res.on('data', chunk => buf += chunk);
            res.on('end', () => {
                let data = JSON.parse(buf);
                resolve(data);
            });
            res.on('error', e => {
                console.error(e);
                reject(e);
            });
        });
    });
}

testReq.then(val => {
    search.printMiniheader('begin-raw response');
    console.dir(val);
    search.printMiniheader('end-raw response');

    search.printMiniheader('begin-results');
    console.dir(val.results || 'No results!');
    search.printMiniheader('end-results');
    
    detailsReq(val.results || [], 2).then(deets => {
        search.printMiniheader('begin-place details');
        console.dir(deets);
        search.printMiniheader('end-place details');
    });
}).catch(e => console.error(e));;