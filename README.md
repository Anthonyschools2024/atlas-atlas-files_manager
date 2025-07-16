
Files Manager API

A simple, secure platform for uploading, managing, and viewing files. This project is built with a modern back-end stack, demonstrating user authentication, database management, and asynchronous background processing.

✨ Key Features

    User Authentication: Secure token-based authentication (email/password).

    File Management: Upload new files, view file details, and list all personal files with pagination.

    Access Control: Set files as public or private.

    Asynchronous Thumbnail Generation: Image thumbnail creation (100px, 250px, 500px) is handled by a background worker to ensure fast API responses.

    Direct File Serving: Securely access and view file content.

🛠️ Technology Stack

    Server: Node.js, Express.js

    Database: MongoDB (for persistent user and file metadata)

    Cache & Job Queue: Redis

    Background Worker: Bull

    Testing: Mocha

    Linting: ESLint

🚀 Getting Started

Prerequisites

Ensure you have the following installed on your local machine:

    Node.js (version 12.x.x)

    MongoDB

    Redis

    Nodemon (recommended for development): npm install -g nodemon

Installation & Setup

    Clone the repository:
    Bash

git clone <your-repository-url>
cd files_manager

Install dependencies:
Bash

npm install

Environment Variables:
By default, the application connects to services on localhost. The storage folder for files is /tmp/files_manager.

Run the Server:
This command starts the main API server.
Bash

npm run start-server

The API will be available at http://localhost:5000.

Run the Background Worker:
This command starts the worker process responsible for generating thumbnails.
Bash

    npm run start-worker

📖 API Endpoints

Authentication is required for all /files endpoints and GET /users/me. The authentication token must be passed in the X-Token header.
Method	Endpoint	Description	Auth Required
POST	/users	Creates a new user.	No
GET	/connect	Signs a user in, returning an auth token.	No
GET	/disconnect	Signs a user out.	Yes
GET	/users/me	Retrieves the authenticated user's details.	Yes
POST	/files	Uploads a new file.	Yes
GET	/files	Lists all of the user's files with pagination.	Yes
GET	/files/:id	Retrieves the details of a specific file.	Yes
PUT	/files/:id/publish	Makes a file public.	Yes
PUT	/files/:id/unpublish	Makes a file private.	Yes
GET	/files/:id/data	Serves the raw content of a file.	No (if public)

👤 Author

[Your Name]

    [Link to your GitHub Profile]

    [Link to your Twitter/LinkedIn]

Files Manager API

A simple, secure platform for uploading, managing, and viewing files. This project is built with a modern back-end stack, demonstrating user authentication, database management, and asynchronous background processing.

✨ Key Features

    User Authentication: Secure token-based authentication (email/password).

    File Management: Upload new files, view file details, and list all personal files with pagination.

    Access Control: Set files as public or private.

    Asynchronous Thumbnail Generation: Image thumbnail creation (100px, 250px, 500px) is handled by a background worker to ensure fast API responses.

    Direct File Serving: Securely access and view file content.

🛠️ Technology Stack

    Server: Node.js, Express.js

    Database: MongoDB (for persistent user and file metadata)

    Cache & Job Queue: Redis

    Background Worker: Bull

    Testing: Mocha

    Linting: ESLint

🚀 Getting Started

Prerequisites

Ensure you have the following installed on your local machine:

    Node.js (version 12.x.x)

    MongoDB

    Redis

    Nodemon (recommended for development): npm install -g nodemon

Installation & Setup

    Clone the repository:
    Bash

git clone <your-repository-url>
cd files_manager

Install dependencies:
Bash

npm install

Environment Variables:
By default, the application connects to services on localhost. The storage folder for files is /tmp/files_manager.

Run the Server:
This command starts the main API server.
Bash

npm run start-server

The API will be available at http://localhost:5000.

Run the Background Worker:
This command starts the worker process responsible for generating thumbnails.
Bash

    npm run start-worker

📖 API Endpoints

Authentication is required for all /files endpoints and GET /users/me. The authentication token must be passed in the X-Token header.
Method	Endpoint	Description	Auth Required
POST	/users	Creates a new user.	No
GET	/connect	Signs a user in, returning an auth token.	No
GET	/disconnect	Signs a user out.	Yes
GET	/users/me	Retrieves the authenticated user's details.	Yes
POST	/files	Uploads a new file.	Yes
GET	/files	Lists all of the user's files with pagination.	Yes
GET	/files/:id	Retrieves the details of a specific file.	Yes
PUT	/files/:id/publish	Makes a file public.	Yes
PUT	/files/:id/unpublish	Makes a file private.	Yes
GET	/files/:id/data	Serves the raw content of a file.	No (if public)

👤 Author

[Your Name]

    [Link to your GitHub Profile]

    [Link to your Twitter/LinkedIn]

Files Manager API

A simple, secure platform for uploading, managing, and viewing files. This project is built with a modern back-end stack, demonstrating user authentication, database management, and asynchronous background processing.

✨ Key Features

    User Authentication: Secure token-based authentication (email/password).

    File Management: Upload new files, view file details, and list all personal files with pagination.

    Access Control: Set files as public or private.

    Asynchronous Thumbnail Generation: Image thumbnail creation (100px, 250px, 500px) is handled by a background worker to ensure fast API responses.

    Direct File Serving: Securely access and view file content.

🛠️ Technology Stack

    Server: Node.js, Express.js

    Database: MongoDB (for persistent user and file metadata)

    Cache & Job Queue: Redis

    Background Worker: Bull

    Testing: Mocha

    Linting: ESLint

🚀 Getting Started

Prerequisites

Ensure you have the following installed on your local machine:

    Node.js (version 12.x.x)

    MongoDB

    Redis

    Nodemon (recommended for development): npm install -g nodemon

Installation & Setup

    Clone the repository:
    Bash

git clone <your-repository-url>
cd files_manager

Install dependencies:
Bash

npm install

Environment Variables:
By default, the application connects to services on localhost. The storage folder for files is /tmp/files_manager.

Run the Server:
This command starts the main API server.
Bash

npm run start-server

The API will be available at http://localhost:5000.

Run the Background Worker:
This command starts the worker process responsible for generating thumbnails.
Bash

    npm run start-worker

📖 API Endpoints

Authentication is required for all /files endpoints and GET /users/me. The authentication token must be passed in the X-Token header.
Method	Endpoint	Description	Auth Required
POST	/users	Creates a new user.	No
GET	/connect	Signs a user in, returning an auth token.	No
GET	/disconnect	Signs a user out.	Yes
GET	/users/me	Retrieves the authenticated user's details.	Yes
POST	/files	Uploads a new file.	Yes
GET	/files	Lists all of the user's files with pagination.	Yes
GET	/files/:id	Retrieves the details of a specific file.	Yes
PUT	/files/:id/publish	Makes a file public.	Yes
PUT	/files/:id/unpublish	Makes a file private.	Yes
GET	/files/:id/data	Serves the raw content of a file.	No (if public)

👤 Author

[Your Name]

    [Link to your GitHub Profile]

    [Link to your Twitter/LinkedIn]
