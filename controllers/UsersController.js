import crypto from 'crypto';
import dbClient from '../utils/db';

/**
 * Controller for user-related operations.
 */
class UsersController {
  /**
   * Handles the creation of a new user.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static async postNew(req, res) {
    const { email, password } = req.body;

    // 1. Validate email
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // 2. Validate password
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // 3. Check if user already exists
    try {
      const usersCollection = dbClient.db.collection('users');
      const user = await usersCollection.findOne({ email });

      if (user) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // 4. Hash password and create user
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const result = await usersCollection.insertOne({
        email,
        password: hashedPassword,
      });

      // 5. Return new user
      const newUser = {
        id: result.insertedId,
        email,
      };

      return res.status(201).json(newUser);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  }
}

export default UsersController;
