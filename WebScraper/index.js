// ScrapingService

var express = require('express');
var app = express();
var cors = require('cors');
app.use(cors());
// For parsing application/json, increased size to get around pesky stuff
    // app.use(.json());
app.use(express.json({limit: '200mb'}));
// For parsing application/x-www-form-urlencoded
    // app.use(.urlencoded({ extended: true }));
app.use(express.urlencoded({limit: '200mb', extended: true}));

app.get('/getPackageData/:packageName', async function(req, res) {
    let packageName = req.params.packageName;
    console.log("getPackageData: "+packageName);
    try {
        let packageData = await getPackageData(packageName);
        res.send(packageData);
    } catch (error) {
        console.log(error);
        res.status(500).send('500 Internal Server Error');
    };
});

var puppeteer = require('puppeteer');

async function getPackageData(packageName) {
    // # dependents, # dependencies, # versions, age (years), weekly downloads
    let browser = await puppeteer.launch({headless:
        // false
        "new"
    });
    let page = await getPage(packageName, browser);
    let packageData = await loadPackageData(page);
    await browser.close();
    console.log(Object.values(packageData));
    return packageData;
}
async function getPage(packageName, browser) {
    let page = await browser.newPage();
    await page.goto(`https://www.npmjs.com/package/${packageName}`, { waituntil: "load" } );
    return page;
}

async function loadPackageData(page) {
    console.log("Loading data...");
    // document.querySelectorAll("li > a > span")[idx].innerText
        // [3] numDependents
        // [2] numDependencies
        // [4] numVersions
    let nn = await page.$$("li > a > span");
    let numDependents = await page.evaluate((el) => el.innerText, nn[3]);
    let numDependencies = await page.evaluate((el) => el.innerText, nn[2]);
    let numVersions = await page.evaluate((el) => el.innerText, nn[4]);
    // weeklyDownloads
    let n = await page.$("[aria-label='Showing weekly downloads'] div p");
    let weeklyDownloads = await page.evaluate((el) => el.innerText, n);
    
        await timeout(1000); // yay magic, increase if starts failing
        // await timeout(100000); // for debugging
        /**
             Array.from(document.querySelectorAll('div div div h3'))
            .filter((word) => word.innerText == "Unpacked Size")[0].closest("div").children[1].innerText
            */
           // gets the parent then the sibling
            // Works for: 
                // unpackedSize, totalFiles, issues, pullRequests, lastPublished
        let arr = await page.$$('div div div h3');
        let unpackedSize = await getOrFail("Unpacked Size", arr, page);
        let totalFiles = await getOrFail("Total Files", arr, page);
        let issues = await getOrFail("Issues", arr ,page);
        let pullRequests = await getOrFail("Pull Requests", arr, page);
        let lastPublished = await getOrFail("Last publish", arr, page);
        numDependencies = numDependencies==-1?-1:parseInt(clean(numDependencies));
        numDependents = numDependents==-1?-1:parseInt(clean(numDependents));
        numVersions = numVersions==-1?-1:parseInt(clean(numVersions));
        weeklyDownloads = weeklyDownloads==-1?-1:parseInt(clean(weeklyDownloads));
        unpackedSize = unpackedSize==-1?-1:convertToKb(unpackedSize);
        lastPublished = lastPublished==-1?-1:monthDayOrYear(lastPublished);
        totalFiles = totalFiles==-1?-1:parseInt(totalFiles);
        issues = issues==-1?-1:parseInt(issues);
        pullRequests = pullRequests==-1?-1:parseInt(pullRequests);

    let toRet = {
        numDependencies, // need to clean
        numDependents,// need to clean
        numVersions,// need to clean
        weeklyDownloads,// need to clean
        unpackedSize,// need to parse and convert to kb
        totalFiles,
        issues,
        pullRequests,
        lastPublished// need to parse and convert to years, for now 0
    };
    return toRet;
}

async function getOrFail(str, arr, page) {
    let barr = (await asyncFilter(arr, async (word) => 
        {
        let text = await page.evaluate((el) => el.innerText, word);
        return text == str;
        }));
        return barr.length?await page.evaluate((el) => el.closest("div").children[1].innerText, barr[0]):-1;
}

let asyncFilter = async (arr, predicate) => {
    let results = await Promise.all(arr.map(predicate));
    return arr.filter((_v, index) => results[index]);
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function clean (str) {
    return str.split(" ")[0].split(",").join("");
}

function monthDayOrYear(str) {
    if (str.includes("day")) {
        return 2;
    } else if (str.includes("month")) {
        return 1;
    } else if (str.includes("year")) {
        return 0;
    } else {
        return -1;
    }
}

function convertToKb(input) {
    // Split the input string into value and unit
    let [value, unit] = input.split(" ");
    
    // Convert the value to a number
    value = parseFloat(value);

    // Normalize the unit to lowercase for comparison
    unit = unit.toLowerCase();

    // Define conversion factors relative to kilobytes
    let conversionFactors = {
        "b": 1 / 1024,   // bytes to kilobytes
        "kb": 1,         // kilobytes to kilobytes
        "mb": 1024,      // megabytes to kilobytes
        "gb": 1024 * 1024, // gigabytes to kilobytes
        "tb": 1024 * 1024 * 1024 // terabytes to kilobytes
    };

    // Check if the unit exists in our conversion factors
    if (conversionFactors[unit]) {
        // Return the value converted to kilobytes
        return value * conversionFactors[unit];
    } else {
        // If unit is unknown, return null or throw an error
        throw new Error(`Unknown memory unit: ${unit}`);
    }
}

console.log("Up and runnning!");

app.listen(8083);