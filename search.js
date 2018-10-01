const https = require('https');


const apiKey = 'key=AIzaSyDWR6zUgE9BfMQU-u_p21yJqXlp5CbbBfA';

const searchURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const loc = '&location=29.6478,-82.33784';
const rankBy = '?rankby=distance';
const keyword = '&keyword=heart';
const type = '&type=doctor'
const testUrl = `${searchURL}${rankBy}${keyword}${type}${loc}&${apiKey}`;

const detailURL = `https://maps.googleapis.com/maps/api/place/details/json?${apiKey}`;

function sleep(ms) {return new Promise(resolve => setTimeout(resolve, ms))}

function urlGen(query) {return searchURL + '?' + query + '&' + apiKey}

function searchFromQuery(query) { return search(urlGen(query)); }
exports.querySearch = searchFromQuery;

function search(url, page=0) {return new Promise(resolve => recursiveSearch(url).then(data => resolve(makePage(data, page))));}
exports.search = search;

function searchReq(url) {
    var buf = '';
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            res.on('data', chunk => buf += chunk);
            res.on('end', () => {
                let data = JSON.parse(buf);
                resolve(data);
            });
        }).on('error', e => {
            console.error(e);
            reject(e);
        });
    });
}
function recursiveSearch(url, retry=0) {
    return new Promise((resolve, reject) => {
        searchReq(url).then(data => {
            let status = data.status || 'INTERNAL_ERROR';
            if(status == 'OK') resolve(data);
            else {
                if(retry < 50){
                    resolve(recursiveSearch(url, retry+1).then(data => {return data}));
                } else reject('ERROR: SERVER TIMEOUT, STATUS=' + status);
            };
        });
    });
};
function makePage(data, pageNum) {
    let page = {
        pageNum: pageNum,
        npt: data.next_page_token || '',
        results: pageShorthand(data),
    }
    return page;
}

function pageShorthand(data) {
    let list = [];
    if(data.results) {
        data.results.forEach(e => list.push({name: e.name || '', place_id: e.place_id || ''}));
        return list;
    }
    else throw 'ERROR: PAGE NOT VALID';
}
function pageShorthandString(data) {
    list = [];
    try { pageShorthand(page).forEach(e => list.push(JSON.stringify(e))); }
    catch(e) { console.error(e); }
    return list;
}

function printPage(page) {
    printMiniheader(`begin-page ${page.pageNum}`);
    page.results.forEach(e => console.dir(e));
    if(page.npt) console.log('CONTINUED...');
    printMiniheader(`end-page ${page.pageNum}`);
}
function printAllPages(page) {
    printPage(page);
    return new Promise(resolve => {
        getNextPage(page).then(nextPage => {
            resolve(page.npt ? printAllPages(nextPage) : '');
        });
    });
} exports.printResults = printAllPages;

// TODO: Handle invalid page numbers better. Right now this is a little shaky.
function getNextPageUrl(token) { return url = `${searchURL}${apiKey}&pagetoken=${token}`; }
function getNextPage(page) {
    let url = page.npt ? getNextPageUrl(page.npt) : '';
    return new Promise(resolve => {
        if(url == '') {
            console.error('END OF RESULTS');
            resolve(page);
        } else search(url, (page.pageNum != null ? page.pageNum+1 : 0)).then(next => resolve(next));
    });
}
function goToPage(basePage, pageNum) {
    return new Promise(resolve => {
        if(pageNum < 0 || !Number.isFinite(pageNum)) {
            console.error('ERROR: INVALID PAGE NUMBER');
            resolve(basePage);
        }
        if(basePage.pageNum == pageNum) resolve(basePage);
        else getNextPage(basePage).then(next => {
            if(jsonCompare(basePage, next)) resolve(next);
            else resolve(goToPage(next, pageNum).then(ret => {return ret}));
        });
    });
}

function getPlace(page, index) {return page.results[index] || {};}
function getName(place) {return place.name || '';}
function getID(place) {return place.place_id || '';}

function getPlaceDetails(id) {
    let url = detailURL + `&placeid=${id || ''}`;
    return new Promise(resolve => recursiveSearch(url).then(data => resolve(data)).catch(e => console.error(e)));
} exports.getDetails = getPlaceDetails;

function printHeader(message) {
    console.log(message.toUpperCase());
    console.log('---------------------------------------------');
}; exports.printHeader = printHeader;
function printSubheader(message) {
    console.log(message.toUpperCase());
    console.log('-------------------------');
}; exports.printSubheader = printSubheader;
function printMiniheader(message) {
    console.log(message.toUpperCase());
    console.log('---------');
}; exports.printMiniheader = printMiniheader;

function jsonCompare(a, b) {return JSON.stringify(a) === JSON.stringify(b)};
exports.jsonCompare = jsonCompare;

/* BEGIN TESTS */

function test1() { 
    printHeader('begin-test1');
    search(testUrl).then(page => {
    printSubheader('begin-raw page');
    console.dir(page);
    printSubheader('end-raw page');

    if(page.results) {
        printSubheader('begin-print page');
        printPage(page);
        printSubheader('end-print page');

        printSubheader('begin-singular place');
        let place = getPlace(page, 2);
        console.dir(place);
        printSubheader('end-singular place');

        printSubheader('begin-singular place details');
        getPlaceDetails(getID(place)).then(data => {
            console.dir(data);
            printSubheader('end-singular place details');

            printSubheader('begin-page selection');
            goToPage(page, 2).then(next => {
                printPage(page);
                printPage(next);
                goToPage(page, 0).then(after => {
                    printPage(after);
                    printSubheader('end-page selection');

                    printSubheader('begin-page turning');
                    printAllPages(page).then(v => printSubheader('end-page turning'));
                    printHeader('end-test1');
                });


            });
        }).catch(e => console.error(e));
    }
});}
//test1();

function test2() { 
    printHeader('begin-test2');
    search(testUrl).then(page => {
    console.dir(!Number.isFinite(1));
    printMiniheader('begin-initial search results');
    console.dir(page);
    printMiniheader('end-initial search results');

    var nextPage = getNextPage(page).then(next => {
        printMiniheader('begin-getNextPage(page)');
        console.dir(next);
        printMiniheader('end-getNextPage(page)');
    }).catch(e => console.error(e));

    var goPageNeg = goToPage(page, -5).then(next => {
        printMiniheader('begin-goToPage(page, -5) (error)');
        console.dir(next);
        printMiniheader('end-goToPage(page, -5) (error)');
    });
    var goPage0 = goToPage(page, 0).then(next => {
        printMiniheader('begin-goToPage(page, 0)');
        console.dir(next);
        printMiniheader('end-goToPage(page, 0)');
    });
    var goPage1 = goToPage(page, 1).then(next => {
        printMiniheader('begin-goToPage(page, 1)');
        console.dir(next);
        printMiniheader('end-goToPage(page, 1)');
    });
    var goPage2 = goToPage(page, 2).then(next => {
        printMiniheader('begin-goToPage(page, 2)');
        console.dir(next);
        printMiniheader('end-goToPage(page, 2)');
    });
    var goPageE = goToPage(page, 5).then(next => {
        printMiniheader('begin-goToPage(page, 5) (error)');
        console.dir(next);
        printMiniheader('end-goToPage(page, 5) (error)');
    });

    Promise.all([nextPage, goPageNeg, goPage0, goPage1, goPage2, goPageE]).then(vals => printHeader('end-test2'));
});}
//test2();

/* END TESTS */