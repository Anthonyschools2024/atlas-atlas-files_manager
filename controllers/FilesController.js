import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises, createReadStream } from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import fileQueue from '../utils/queue';

// ... (formatFileResponse helper function is unchanged)

/**
 * Controller for file-related operations.
 */
class FilesController {
  static async postUpload(req, res) {
    // ... (Authentication and validation logic is unchanged)
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId = '0', isPublic = false, data,
    } = req.body;
    // ... (validation continues)

    // ... (folder creation logic is unchanged)

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    await fsPromises.mkdir(folderPath, { recursive: true });

    const localPath = path.join(folderPath, uuidv4());
    const fileData = Buffer.from(data, 'base64');

    try {
      await fsPromises.writeFile(localPath, fileData);
    } catch (err) {
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

    // If the file is an image, add a job to the queue
    if (type === 'image') {
      await fileQueue.add({
        userId: newFile.userId.toString(),
        fileId: result.insertedId.toString(),
      });
    }

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

  // ... (getShow, getIndex, putPublish, putUnpublish methods are unchanged)

  static async getFile(req, res) {
    const fileId = req.params.id;
    const { size } = req.query; // Get size from query parameters
    const validSizes = ['500', '250', '100'];

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

    let filePath = file.localPath;
    // If a valid size is requested, modify the path to point to the thumbnail
    if (size && validSizes.includes(size)) {
      filePath = `${file.localPath}_${size}`;
    }

    try {
      await fsPromises.access(filePath);
      const mimeType = mime.lookup(file.name) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      createReadStream(filePath).pipe(res);
      return null;
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }
  }
}

export default FilesController;
