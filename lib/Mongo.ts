"use strict";

import { MongoClient, ObjectId } from "mongodb";
import * as Debug from "debug";

const debug = Debug("macabre:mongo");

interface Config {
  collection: string;
  database: string;
  uri: string;
 }

export class Mongo {

  private config: Config | any;
  private client: any;

  constructor(config = {}) {

    this.config = config;
    this.config.uri = this.config.uri || `mongodb://127.0.0.1:27017/${this.config.database}`;

    if (!this.config.uri) {
      throw new Error("No connection uri or database is specified in config");
    }

    if (!this.config.collection) {
      throw new Error("No collection is specified in config");
    }

    this.setup();
  }

  async setup() {
    try {
      this.client = await MongoClient.connect(this.config.uri);
    } catch (err) {
      throw err;
    }
  }

  getClient() {
    return this.client;
  }

  insert(query) {

    if (!query) {
      debug("No data");
      return;
    }

    if (!this.client) {
      throw new Error("Mongo client is not initialized");
    }

    const db = this.client.db(this.config.database);

    if (Array.isArray(query)) {
      query.forEach(n => {
        n._id = ObjectId().toString();
      });
    }

    if (typeof query === "object") {
      query._id = ObjectId().toString();
    }

    return db
      .collection(this.config.collection)
      .insert(query)
      .then((data: any) => {
        return data;
      })
      .catch((err: Error) => {
        return Promise.reject(err);
      });
  }

  close() {
    if (this.client) {
      this.client.close();
    }
  }
}
