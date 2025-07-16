import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

/**
 * Controller for file-related operations.
 */
class FilesController {
  /**
   * Handles the upload of a new file.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static async postUpload(req, res) {
    // 1. Authenticate user
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Validate input
    const {
      name, type, parentId = '0', isPublic = false, data,
    } = req.body;
    const allowedTypes = ['folder', 'file', 'image'];

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !allowedTypes.includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    // 3. Validate parent
    if (parentId !== '0') {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    // 4. Handle folder creation
    if (type === 'folder') {
      const newFolder = {
        userId: new ObjectId(userId),
        name,
        type,
        isPublic,
        parentId: parentId === '0' ? 0 : new ObjectId(parentId),
      };
      const result = await dbClient.db.collection('files').insertOne(newFolder);
      return res.status(201).json({ id: result.insertedId, ...newFolder, parentId: newFolder.parentId.toString() });
    }

    // 5. Handle file/image creation
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    await fs.mkdir(folderPath, { recursive: true });

    const localPath = path.join(folderPath, uuidv4());
    const fileData = Buffer.from(data, 'base64');

    try {
      await fs.writeFile(localPath, fileData);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }

    const newFile = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === '0' ? 0 : new ObjectId(parentId),
      localPath,
    };

    const result = await dbClient.db.collection('files').insertOne(newFile);

    const responseFile = {
      id: result.insertedId,
      userId: newFile.userId,
      name: newFile.name,
      type: newFile.type,
      isPublic: newFile.isPublic,
      parentId: newFile.parentId.toString(),
    };

    return res.status(201).json(responseFile);
  }
}

export default FilesController;
