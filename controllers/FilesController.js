import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises, createReadStream } from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// Helper function to format file documents for response
const formatFileResponse = (file) => {
  if (!file) return null;
  return {
    id: file._id,
    userId: file.userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId && file.parentId.toString() !== '0' ? file.parentId : 0,
  };
};

/**
 * Controller for file-related operations.
 */
class FilesController {
  // ... (postUpload, getShow, getIndex, putPublish, putUnpublish methods are unchanged)
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

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
      return res.status(201).json(formatFileResponse({ ...newFolder, _id: result.insertedId }));
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    await fsPromises.mkdir(folderPath, { recursive: true });

    const localPath = path.join(folderPath, uuidv4());
    const fileData = Buffer.from(data, 'base64');

    try {
      await fsPromises.writeFile(localPath, fileData);
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
    return res.status(201).json(formatFileResponse({ ...newFile, _id: result.insertedId }));
  }

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

    return res.status(200).json(formatFileResponse(file));
  }

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
    const formattedFiles = files.map(formatFileResponse);
    return res.status(200).json(formattedFiles);
  }

  static async updatePublicStatus(req, res, isPublic) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) return res.status(404).json({ error: 'Not found' });

    const filesCollection = dbClient.db.collection('files');
    const result = await filesCollection.findOneAndUpdate(
      { _id: new ObjectId(fileId), userId: new ObjectId(userId) },
      { $set: { isPublic } },
      { returnDocument: 'after' },
    );

    if (!result.value) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json(formatFileResponse(result.value));
  }

  static async putPublish(req, res) {
    return FilesController.updatePublicStatus(req, res, true);
  }

  static async putUnpublish(req, res) {
    return FilesController.updatePublicStatus(req, res, false);
  }

  /**
   * Serves the content of a file.
   * @param {object} req The Express request object.
   * @param {object} res The Express response object.
   */
  static async getFile(req, res) {
    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    const token = req.headers['x-token'];
    const userId = token ? await redisClient.get(`auth_${token}`) : null;

    const isOwner = userId && file.userId.toString() === userId;

    if (!file.isPublic && !isOwner) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    try {
      await fsPromises.access(file.localPath);
      const mimeType = mime.lookup(file.name) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      createReadStream(file.localPath).pipe(res);
      return null;
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }
  }
}

export default FilesController;
