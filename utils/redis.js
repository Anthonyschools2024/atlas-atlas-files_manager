import { createClient } from 'redis';
import { promisify } from 'util';

/**
 * Represents a client for interacting with the Redis server.
 */
class RedisClient {
  /**
   * Creates a new RedisClient instance.
   */
  constructor() {
    this.client = createClient();

    // Display any errors in the console
    this.client.on('error', (err) => {
      console.error(`Redis client error: ${err}`);
    });
  }

  /**
   * Checks if the client's connection to the Redis server is active.
   * @returns {boolean} True if connected, otherwise false.
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Retrieves the value stored in Redis for a given key.
   * @param {string} key The key to retrieve.
   * @returns {Promise<string|null>} The value of the key, or null if not found.
   */
  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);
    return getAsync(key);
  }

  /**
   * Stores a key-value pair in Redis with an expiration.
   * @param {string} key The key to store.
   * @param {string|number} value The value to store.
   * @param {number} duration The expiration time in seconds.
   * @returns {Promise<void>}
   */
  async set(key, value, duration) {
    const setexAsync = promisify(this.client.setex).bind(this.client);
    await setexAsync(key, duration, value);
  }

  /**
   * Deletes a key from Redis.
   * @param {string} key The key to delete.
   * @returns {Promise<void>}
   */
  async del(key) {
    const delAsync = promisify(this.client.del).bind(this.client);
    await delAsync(key);
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
