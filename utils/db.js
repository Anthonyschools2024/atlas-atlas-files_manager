import { MongoClient } from 'mongodb';

// Read database configuration from environment variables or use defaults
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}`;

/**
 * Represents a client for interacting with the MongoDB database.
 */
class DBClient {
  /**
   * Creates a new DBClient instance and connects to the database.
   */
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.db = null; // Initialize db as null

    // Connect to the MongoDB server
    this.client.connect((err) => {
      if (!err) {
        this.db = this.client.db(database);
      } else {
        console.error(`MongoDB connection error: ${err.message}`);
        this.db = null;
      }
    });
  }

  /**
   * Checks if the client's connection to the MongoDB server is active.
   * @returns {boolean} True if connected, otherwise false.
   */
  isAlive() {
    return !!this.db;
  }

  /**
   * Retrieves the number of documents in the 'users' collection.
   * @returns {Promise<number>} The total number of users.
   */
  async nbUsers() {
    if (!this.isAlive()) return 0;
    return this.db.collection('users').countDocuments();
  }

  /**
   * Retrieves the number of documents in the 'files' collection.
   * @returns {Promise<number>} The total number of files.
   */
  async nbFiles() {
    if (!this.isAlive()) return 0;
    return this.db.collection('files').countDocuments();
  }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;
