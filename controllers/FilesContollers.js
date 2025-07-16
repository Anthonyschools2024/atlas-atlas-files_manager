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
  static async postUpload(req, res) {
    // ... (existing postUpload method is unchanged)
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

    const {
      name, type, parentId = '0', isPublic = false, data,
    } = req.body;
    const allowedTypes = ['folder', 'file', 'image'];

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !allowedTypes.includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    if (parentId !== '0') {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type === 'folder') {
      const newFolder = {
        userId: new ObjectId(userId),
        name,
        type,
        isPublic,
        parentId: parentId === '0' ? 0 : new ObjectId(parentId),
      };
      const result = await dbClient.db.collection('files').insertOne(newFolder);
      const responseFolder = {
        id: result.insertedId,
        userId: newFolder.userId,
        name: newFolder.name,
        type: newFolder.type,
        isPublic: newFolder.isPublic,
        parentId: newFolder.parentId.toString() === '0' ? 0 : newFolder.parentId,
      };
      return res.status(201).json(responseFolder);
    }

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
      parentId: newFile.parentId.toString() === '0' ? 0 : newFile.parentId,
    };

    return res.status(201).json(responseFile);
  }

  /**
   * Retrieves a file document based on its ID.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) return res.status(404).json({ error: 'Not found' });

    const file = await dbClient.db.collection('files').findOne({
      _id: new ObjectId(fileId),
      userId: new ObjectId(userId),
    });

    if (!file) return res.status(404).json({ error: 'Not found' });

    const responseFile = {
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId.toString() === '0' ? 0 : file.parentId,
    };

    return res.status(200).json(responseFile);
  }

  /**
   * Retrieves all file documents for a user with pagination.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parentId = req.query.parentId || '0';
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;

    const matchQuery = {
      userId: new ObjectId(userId),
      parentId: parentId === '0' ? 0 : new ObjectId(parentId),
    };

    const pipeline = [
      { $match: matchQuery },
      { $skip: page * pageSize },
      { $limit: pageSize },
    ];

    const files = await dbClient.db.collection('files').aggregate(pipeline).toArray();

    const formattedFiles = files.map((file) => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId.toString() === '0' ? 0 : file.parentId,
    }));

    return res.status(200).json(formattedFiles);
  }
}

export default FilesController;
