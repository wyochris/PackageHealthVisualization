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

var puppeteer = require('puppeteer');

    //#region Scrape
    async function getPage(daysAgo) {
        const browser = await puppeteer.launch({headless: "new"});
        const options = {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ],
            headless: true
        }
        const page = await browser.newPage(options);
        await page.goto("", { waituntil: "load" } );
        return page;
    }
    // meals = ["breakfast", "lunch", "dinner"];
    // meals = ["brunch"];
    // meals = ["brunch", "dinner"];
    async function getPackageData(daysAgo,mealstr) {
        let toRet = [];
        // Make sure to get from all meals and also from all food tiers
            // document.querySelector("#lunch .site-panel__daypart-tabs [data-key-index='0'] .h4")
            // Special: data-key-index 0
            // Additional: data-key-index 1
            // Condiment: data-key-index 2
        // Good for double-checking overall "#breakfast .script", has an array of all food IDs in meal
                // puppeteering
        const page = await getPage(daysAgo);
        let menu = await JSON.parse(await getMenu(page));
        await getFoods(page, mealstr,foodTier.Special, toRet,menu);
        await getFoods(page, mealstr,foodTier.Additional, toRet,menu);
        await getFoods(page, mealstr,foodTier.Condiment, toRet,menu);
        return toRet;
    }

    async function getFoods(page,mealstr,tier,toRet,menu) {
        const nn = await page.$$("#"+mealstr+" .site-panel__daypart-tabs [data-key-index='"+tier+"'] .h4"); // all foods in the meal
        for (let i = 0; i < nn.length; i++) {
            const id = ( await page.evaluate((el) => el.getAttribute("data-id"), nn[i]));
            // console.log("data id: "+id);
            const name = menu[id]["label"];
            // console.log("fude name: "+name);
            // console.log(name);
            if ("nutrition_details" in menu[id] && Object.keys(menu[id]["nutrition_details"]).length > 0) {
                const calories = menu[id]["nutrition_details"]["calories"]["value"];
                const carbs = menu[id]["nutrition_details"]["carbohydrateContent"]["value"];
                const rote = menu[id]["nutrition_details"]["proteinContent"]["value"];
                const phat = menu[id]["nutrition_details"]["fatContent"]["value"];
                const servingSize = menu[id]["nutrition_details"]["servingSize"]["value"];
                const servingUnits = menu[id]["nutrition_details"]["servingSize"]["unit"];
                
                const v = ("cor_icon" in menu[id]) && ("1" in menu[id]["cor_icon"]); // if there is no cor_icon then consider using gpt-ing, but prlly good enough to assume meat
                const ve = ("cor_icon" in menu[id]) && ("4" in menu[id]["cor_icon"]); // may be subject to update
                const gf = ("cor_icon" in menu[id]) && ("9" in menu[id]["cor_icon"]);
    
                if (name.includes("tuscan chicken and kale stew")) {
                    console.log("tuscan food: "+name);
                    console.log("fooed veg?: "+(("cor_icon" in menu[id]) && ("1" in menu[id]["cor_icon"])));
    
                    console.log("vegetarian: "+v);
                    console.log("vegan: "+ve);
                    console.log("gluten free: "+gf);
                }
    
                // the front end should also recoil in horror, separately
                    // There should be a strikethrough /graying out of any non-veg in reqs or general list
                toRet.push(food_factory(id,name,calories,carbs,rote,phat,mealstr,tier,servingSize,servingUnits,false,v,ve,gf));
            } else {
                toRet.push(food_factory(id,name,0,0,0,0,mealstr,tier,0,"",true,true,false,false)); // Southwest Beef Bowl case
            }
        }
    }

    app.get('/getPackageData/:packageName', async function(req, res) {
        console.log("getPackageData: "+req.params.packageName);
        let mealnames = [];
        try {
                // mealnames = await getMealNames(daysAgo);
            res.send(mealnames);
        } catch (error) {
            res.status(500).send('500 Internal Server Error');
        };
    });

    console.log("Up and runnning!");


app.listen(3000);