# macabre
All purpose website scraper based on puppeteer. It will save to either mongo and Relational DB for now (Tested on MySQL). Used mongo native nodejs driver and also sequelize. 

How it works, it will use puppeteer as headless browser to navigate to web page, and after defining the ETL function, it can be saved dynamically to the database of your choice. It will create the database and collection/table dynamically.

### Getting Started
1. Using `node` > 8.
2. `npm install macabre` or `yarn add macabre`
3. Having the database of your choice up and running
4. Just like in the example folder, this is the `nodejs` example:
```js
const { Macabre } = require("macabre");
const config = {
  url: "https://coinmarketcap.com/",
  dialect: "mongo",
  database: "test",
  collection: "crypto"
};
const etl = async (page, next) => {
  const array = [];
  const currencies = await page.$$eval(".currency-name-container", el => {
    return el.map(x => x.innerHTML);
  });
  const prices = await page.$$eval(".price", el => {
    return el.map(x => x.innerHTML);
  });
  const volumes = await page.$$eval(".volume", el => {
    return el.map(x => x.innerHTML);
  });
  currencies.forEach((n, i) => {
    array.push({
      name: n,
      price: prices[i] || null,
      volume: volumes[i] || null
    });
  });

  next(null, array);
};

const test = new Macabre(config, etl);

```

### More Information
1. The ETL Function will return `page` as first parameter object which is the page object of puppeteer.
2. The second one will be `next` function to throw and error or save to database.
3. There are two parameter of `next` function, the first one is error, and the second one is the value to be saved.
4. Please refer to [`puppeteer`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md) and [`sequelize`](http://docs.sequelizejs.com/) for more information.

### Configuration
```
  url: string; // REQUIRED: URL of navigation
  dialect: string; // REQUIRED: Database of your choice ["mongo", "mysql", "postgresql"]
  database: string; // REQUIRED: Database name
  collection: string; // REQUIRED: Collection or table name
  username: string; // // Username of database
  password: string; // Password of database
  host: string; // Host of the database, default is '127.0.0.1'
  pool: any; // Object of Pool config based on sequelize
  port: number; // Port of the database, default is th default respected database port
  storage: string; // For SQLite only
```