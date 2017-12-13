"use strict";

import * as Seq from "sequelize";
import * as Debug from "debug";
import { isUri } from "valid-url";

const debug = Debug("macabre:sequelize");

interface Config {

  username: string;
  password: string;
  database: string;
  collection: string;
  host: string;
  dialect: string;
  pool: any;
  storage: string;
}

export class Sequelize {

  private config: Config | any;
  private client: any;
  private seq: any;
  private model: any;

  constructor(config) {
    this.config = config;
    this.model = null;

    this.seq = {
      dialect: this.config.dialect,
      host: this.config.host || "localhost",
      pool: this.config.pool || {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };

    this.setup();
  }

  async setup() {

    if (this.config.dialect === "sqlite") {
      this.seq.storage = this.config.storage || "./db/db.sqlite";
    }

    try {

      if (isUri(this.config.host)) {
        this.client = await new Seq(this.config.host);
      }
      else {
        this.client = await new Seq(this.config.database, this.config.username, this.config.password, this.seq);
      }

      await this.authenticate();
    }
    catch (err) {

      if (!err.message.includes("Unknown database")) {
        throw err;
      }
      this.client.close();
      this.client = await new Seq("", this.config.username, this.config.password, this.seq);

      debug("Creating new database");
      await this.client.query(`CREATE DATABASE ${this.config.database};`);
      await this.client.query(`USE ${this.config.database};`);
    }
  }

  getClient() {
    return this.client;
  }

  authenticate(){

    debug("Authentication start");

    return this.client
    .authenticate()
      .then(() => {
        debug("Connected successfully");
      })
      .catch(err => {
        throw err;
      });
  }

  getType(val): string {

    let type = "string";
    if (typeof val === "number") {
      type = val % 1 === 0 ? "integer" : "float";
    }
    return type.toUpperCase();
  }

  getCollection(data) {

    const definition = {};

    if (this.model) {
      return this.model;
    }

    Object.keys(data).map((key) => {
      definition[key] = Seq[this.getType(data.key)];
    });

    debug(definition);

    this.model = this.client.define(this.config.collection, definition);
    return this.model;
  }

  insert(data) {

    let example = data;

    if (Array.isArray(data)) {
      example = data[0];
    }

    debug(example);

    const model = this.getCollection(example);

    return model.sync()
    .then(() => {

      if (Array.isArray(data)) {
        return model.bulkCreate(data);
      }

      return model.create(data)
        .catch(e => {throw e; });
    })
    .catch((e) => Promise.reject(e));
  }

  close() {
    this.client.close();
  }
}
