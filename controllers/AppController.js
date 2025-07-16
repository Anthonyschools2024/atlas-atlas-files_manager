import redisClient from '../utils/redis';
import dbClient from '../utils/db';

/**
 * Controller for application-level status and statistics.
 */
class AppController {
  /**
   * Handles the GET /status endpoint.
   * Returns the connection status of Redis and the database.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static getStatus(req, res) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.status(200).json(status);
  }

  /**
   * Handles the GET /stats endpoint.
   * Returns the number of users and files in the database.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static async getStats(req, res) {
    try {
      const stats = {
        users: await dbClient.nbUsers(),
        files: await dbClient.nbFiles(),
      };
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
}

export default AppController;
