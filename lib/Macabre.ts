import * as puppeteer from "puppeteer";
import * as Debug from "debug";
import { Mongo } from "./Mongo";
import { Sequelize } from "./Sequelize";

const debug = Debug("macabre:main");

interface Config {
  url: string; // REQUIRED
  dialect: string; // REQUIRED
  database: string; // REQUIRED
  collection: string; // REQUIRED
  username: string;
  password: string;
  host: string;
  pool: any;
  storage: string;
  port: number;
  repeat: string;
}

export class Macabre {

  private config: Config;
  private get: any;
  private etl: any;
  private page: any;
  private browser: any;
  private dbClient: any;

  constructor(config, etl) {
    this.config = config;
    this.etl = etl;
    this.start();
  }

  async start(): Promise<any> {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(this.config.url, {waitUntil: "networkidle2"});

    process.on("SIGINT", () => {
      this.close();
    });

    process.on("exit", () => {
      this.close();
    });

    this.browser = browser;
    this.page = page;
    this.get = this.getResources();

    try {
      this._initDB();
    } catch (err) {
      throw err;
    }
    this.process();
}

getResources() {
  return {
    page: () => {
      return this.page;
    },
    browser: () => {
      return this.browser;
    }
  };
}

_dbConfig(dialect) {

  let config: any = {
    username: this.config.username,
    password: this.config.password,
    database: this.config.database,
    collection: this.config.collection,
    host: this.config.host,
    dialect: this.config.dialect,
    pool: this.config.pool
  };

  if (dialect === "mongo" || dialect === "mongodb") {
    config = {
      collection: this.config.collection,
      database: this.config.database,
      uri: this.config.host
    };
  }

  if (dialect === "sqlite") {
    config.storage = this.config.storage;
  }

  return config;
}

_initDB() {

  switch (this.config.dialect) {

  case "mongo":
    this.dbClient = new Mongo(this._dbConfig(this.config.dialect));
    break;

  case"mongodb":
    this.dbClient = new Mongo(this._dbConfig(this.config.dialect));
    break;

  case "mysql":
    this.dbClient = new Sequelize(this._dbConfig(this.config.dialect));
    break;

  case "postgres":
    this.dbClient = new Sequelize(this._dbConfig(this.config.dialect));
    break;

  case "postgresql":
    this.dbClient = new Sequelize(this._dbConfig(this.config.dialect));
    break;

  case "sqlite":
    this.dbClient = new Sequelize(this._dbConfig(this.config.dialect));
    break;

  case "mssql":
    this.dbClient = new Sequelize(this._dbConfig(this.config.dialect));
    break;

  default:
    throw new Error("Please provide database dialect");

  }
}

 process() {

  this.etl(this.page, async (err, res) => {

    if (err) {
      throw err instanceof Error ? err : new Error(err);
    }

    try {
      await this.dbClient.insert(res);
    } catch (error) {
      throw error;
    }
    debug("Insert successful");

    if (!this.config.repeat) {
      this.close();
    }
  });

}

  close() {

    if (this.browser) {
        this.browser.close();
      }

    if (this.dbClient) {
      this.dbClient.close();
    }

  }
}
