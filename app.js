const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: '46757e6c-343d-4b3a-b13e-14a43b6bf56d',
    resave: false,
    saveUninitialized: true
}));

app.use(express.static('CSS'));

function checkFileSize() {
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput.files.length > 0) {
      const fileSize = fileInput.files[0].size; // Size in bytes
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (fileSize > maxSize) {
          alert('File size exceeds 10MB. Please upload a smaller file.');
          return false; // Prevent form submission
      }
  }
  return true; // Continue with form submission
}

// MySQL Connection
const db = mysql.createConnection({
    host: 'database-1.cyz0myftgnst.us-east-2.rds.amazonaws.com',
    user: 'admin',
    password: 'Welcome1234',
    port: 3306,
    database: 'Aws_User'
});

// S3 bucket connection request

const aws = require('aws-sdk');
aws.config.update({
    secretAccessKey: 'SYCtJST4oh7Kv/bcYtkNJAwaQw08FuKrCt/VlzPV',
    accessKeyId: 'AKIA5QKWBICWIURL67WT',
    region: 'us-east-2' // Change to your region
});

const s3 = new aws.S3();



db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

// Routes

// Registration Page
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/register.html');
});

app.get('/CSS/styles.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(__dirname + '/CSS/styles.css'); // Adjust the path accordingly
});


// Register User
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(sql, [username, hashedPassword], (err, result) => {
        if (err) {
            console.error(err);
            res.send('Registration failed');
        } else {
            res.send('Registration successful');
        }
    });
});

// Login Page
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Login User
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Check if the user exists
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error(err);
            res.send('Login failed');
        } else if (results.length === 0) {
            res.send('User not found');
        } else {
            const user = results[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                req.session.userId = user.id;
                res.send('Login successful');
            } else {
                res.send('Incorrect password');
            }
        }
    });
});

//Connect with AWS cloud

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//home page
app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/home.html');
  });

app.get('/index', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  const { firstName, lastName, description } = req.body;
  const file = req.file;

  const params = {
    Bucket: 'sogeking',
    Key: file.originalname,
    Body: file.buffer,
    Metadata: {
      'firstname': firstName,
      'lastname': lastName,
      'description': description,
    },
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error(err);
      res.send('Error uploading the file.');
    } else {
      res.redirect('/list');
    }
  });
});

// List files in S3 bucket
app.get('/list', (req, res) => {
  const params = {
    Bucket: 'sogeking',
  };

  s3.listObjects(params, (err, data) => {
    if (err) {
      console.error(err);
      res.send('Error listing files.');
    } else {
      let fileList = '<h1>File List</h1><ul>';
      data.Contents.forEach((file) => {
        fileList += `<li><a href="/download/${file.Key}">${file.Key}</a></li>`;
      });
      fileList += '</ul>';
      res.send(fileList);
    }
  });
});

// Download file from S3
app.get('/download/:key', (req, res) => {
  const key = req.params.key;

  const params = {
    Bucket: 'sogeking',
    Key: key,
  };

  s3.getObject(params, (err, data) => {
    if (err) {
      console.error(err);
      res.send('Error downloading the file.');
    } else {
      res.set('Content-Disposition', `attachment; filename="${key}"`);
      res.send(data.Body);
    }
  });
});

//Connect with AWS cloud

// Dashboard Page (Protected Route)
app.get('/dashboard', (req, res) => {
    if (req.session.userId) {
        res.send('Welcome to the dashboard!');
    } else {
        res.redirect('/login');
    }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
