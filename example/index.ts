"use strict";

import { Macabre } from "../lib/Macabre";

const config: any = {
  url: "https://coinmarketcap.com/",
  dialect: "mysql",
  database: "test",
  collection: "crypto",
  username: "root",
  password: "root"
};

const etl = async (page, next) => {

  const currencies = await page.$$eval(".currency-name-container", el => {
    return el.map(x => x.innerHTML);
  });

  const prices = await page.$$eval(".price", el => {
    return el.map(x => x.innerHTML);
  });

  const volumes = await page.$$eval(".volume", el => {
    return el.map(x => x.innerHTML);
  });

  const array: any[] = [];
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
