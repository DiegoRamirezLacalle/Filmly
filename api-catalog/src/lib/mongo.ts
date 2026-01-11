import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGO_URI || "mongodb://mongo:27017/filmly";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("filmly");
  }
  return db!;
}
