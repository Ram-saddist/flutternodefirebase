// server.js

const express = require('express');
const app = express();
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000;
//const authenticateUser = require('./authenticateUser'); // Reference to the authentication middleware

// Initialize Firebase Admin SDK
const serviceAccount = require('./mobile-app-f17ee-firebase-adminsdk-ps3ju-d94693cc6d.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});


// Middleware for parsing JSON
app.use(express.json());


// Registration route
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Create a new user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email,
            password,
        });

        // Example: Store additional user data in Firestore
        await admin.firestore().collection('users').doc(userRecord.uid).set({
            email,
            // Additional user data...
        });

        res.json({ message: 'User registered successfully', uid: userRecord.uid });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Retrieve user by email using the admin SDK
        const userRecord = await admin.auth().getUserByEmail(email);

        // Verify the password (this is a simple example, in a real-world scenario, you should use a more secure method)
        if (userRecord && userRecord.email === email) {
            // Generate JWT token
            const token = jwt.sign({ uid: userRecord.uid, email: userRecord.email }, 'atmanflutter', {
                expiresIn: '1h', // Token expiration time
            });

            // Include the token in the response header
            res.header('Authorization', `Bearer ${token}`);
            res.json({ message: 'Login successful', userData: { email: userRecord.email } });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error during login:', error);

        // Handle specific authentication errors
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            res.status(401).json({ error: 'Invalid email or password' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

const tokenBlacklist = [];
//logout route
app.post('/logout', (req, res) => {
    try {
        // Extract token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // Check if the token is in the blacklist
        if (token && tokenBlacklist.includes(token)) {
            res.status(401).json({ error: 'Token has already been revoked' });
        } else {
            // Add the token to the blacklist (for demonstration purposes)
            tokenBlacklist.push(token);

            res.json({ message: 'Logout successful' });
        }
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


/*
app.get('/protected-route', authenticateUser, async (req, res) => {
  try {
    // Example: Query data from Firestore using the authenticated user's UID
    const userId = req.uid;
    const userDoc = await admin.firestore().collection('users').doc(userId).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      res.json({ message: 'This is a protected route', userData });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error querying Firestore:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});*/
/*  // for checking whether firebase connected or not
 app.get('/test-firestore-connection', async (req, res) => {
   try {
     const testDoc = await admin.firestore().collection('test').doc('testDoc').get();
 
     if (testDoc.exists) {
       const testData = testDoc.data();
       res.json({ message: 'Connection to Firestore successful', testData });
     } else {
       res.status(404).json({ error: 'Test document not found in Firestore' });
     }
   } catch (error) {
     console.error('Error querying Firestore:', error);
     res.status(500).json({ error: 'Internal Server Error' });
   }
 });
*/



// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
