const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// WebAuthn configuration
const RP_NAME = 'WebAuthn Demo';
const RP_ID = 'localhost';
const ORIGIN = `http://localhost:3000`; // React app origin

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Helper function to convert buffer to base64url
const bufferToBase64URLString = (buffer) => {
  return Buffer.from(buffer).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Helper function to convert base64url to buffer
const base64URLStringToBuffer = (base64URLString) => {
  const base64 = base64URLString.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  return Buffer.from(padded, 'base64');
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'WebAuthn server with Prisma is running' });
});

// Get all users (for testing)
app.get('/api/users', async (req, res) => {
  try {
    const user = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        userId: true,
        createdAt: true,
        authenticators: {
          select: {
            id: true,
            credentialId: true,
            aaguid: true,
            createdAt: true
          }
        }
      }
    });
    res.json(user);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Registration endpoints (for existing users to add WebAuthn)

// Start registration for existing user
app.post('/api/register/begin', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find existing user
    const existingUser = await prisma.users.findUnique({
      where: { username },
      include: { authenticators: true }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found. Please ensure the user exists in the system.' });
    }

    // Generate or use existing userId for WebAuthn
    let webAuthnUserId = existingUser.userId;
    if (!webAuthnUserId) {
      // Generate userId if it doesn't exist
      webAuthnUserId = bufferToBase64URLString(Buffer.from(uuidv4()));
      await prisma.users.update({
        where: { id: existingUser.id },
        data: { userId: webAuthnUserId }
      });
    }

    // Check if user already has authenticators
    const existingAuthenticators = existingUser.authenticators.map(auth => ({
      id: base64URLStringToBuffer(auth.credentialId),
      type: 'public-key',
      transports: ['internal'],
    }));

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: webAuthnUserId,
      userName: existingUser.username,
      userDisplayName: existingUser.name || existingUser.username,
      attestationType: 'none',
      excludeCredentials: existingAuthenticators, // Exclude existing authenticators
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        requireResidentKey: false,
      },
      supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
    });

    // Store challenge in user record
    await prisma.users.update({
      where: { id: existingUser.id },
      data: { currentChallenge: options.challenge }
    });

    res.json({
      options,
      user_id: existingUser.id,
      message: existingAuthenticators.length > 0 ? 
        'Adding additional authenticator to existing user' : 
        'Setting up WebAuthn for existing user'
    });

  } catch (error) {
    console.error('Registration begin error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Complete registration
app.post('/api/register/complete', async (req, res) => {
  try {
    const { user_id, credential } = req.body;

    if (!user_id || !credential) {
      return res.status(400).json({ error: 'User ID and credential are required' });
    }

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { id: user_id }
    });

    if (!user || !user.currentChallenge) {
      return res.status(400).json({ error: 'Invalid user or missing challenge' });
    }

    // Verify registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter, aaguid } = verification.registrationInfo;

      // Store authenticator in database
      await prisma.authenticator.create({
        data: {
          userId: user.id,
          credentialId: bufferToBase64URLString(credentialID),
          credentialPublicKey: bufferToBase64URLString(credentialPublicKey),
          signCount: counter,
          aaguid: aaguid ? aaguid.toString() : null
        }
      });

      // Clear challenge
      await prisma.users.update({
        where: { id: user.id },
        data: { currentChallenge: null }
      });

      res.json({
        verified: true,
        message: 'WebAuthn registration successful',
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          user_id: user.userId,
          role: user.role,
          status: user.status
        }
      });
    } else {
      res.status(400).json({ error: 'Registration verification failed' });
    }

  } catch (error) {
    console.error('Registration complete error:', error);
    res.status(500).json({ error: 'Registration verification failed' });
  }
});

// Authentication endpoints

// Start authentication
app.post('/api/authenticate/begin', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find user
    const user = await prisma.users.findUnique({
      where: { username },
      include: { authenticators: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.authenticators.length === 0) {
      return res.status(400).json({ error: 'No WebAuthn authenticators registered for this user. Please register first.' });
    }

    // Convert authenticators to the format expected by SimpleWebAuthn
    const allowCredentials = user.authenticators.map(auth => ({
      id: base64URLStringToBuffer(auth.credentialId),
      type: 'public-key',
      transports: ['internal'],
    }));

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Store challenge
    await prisma.users.update({
      where: { id: user.id },
      data: { currentChallenge: options.challenge }
    });

    res.json({
      options,
      user_id: user.id
    });

  } catch (error) {
    console.error('Authentication begin error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Complete authentication
app.post('/api/authenticate/complete', async (req, res) => {
  try {
    const { user_id, credential } = req.body;

    if (!user_id || !credential) {
      return res.status(400).json({ error: 'User ID and credential are required' });
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { id: user_id },
      include: { authenticators: true }
    });

    if (!user || !user.currentChallenge) {
      return res.status(400).json({ error: 'Invalid user or missing challenge' });
    }

    // Find authenticator
    const authenticator = user.authenticators.find(
      auth => auth.credentialId === credential.id
    );

    if (!authenticator) {
      return res.status(400).json({ error: 'Authenticator not found' });
    }

    // Verify authentication response
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: base64URLStringToBuffer(authenticator.credentialId),
        credentialPublicKey: base64URLStringToBuffer(authenticator.credentialPublicKey),
        counter: authenticator.signCount,
      },
    });

    if (verification.verified) {
      // Update sign count
      await prisma.authenticator.update({
        where: { id: authenticator.id },
        data: { signCount: verification.authenticationInfo.newCounter }
      });

      // Clear challenge
      await prisma.users.update({
        where: { id: user.id },
        data: { currentChallenge: null }
      });

      res.json({
        verified: true,
        message: 'Authentication successful',
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          user_id: user.userId,
          role: user.role,
          status: user.status
        }
      });
    } else {
      res.status(400).json({ error: 'Authentication verification failed' });
    }

  } catch (error) {
    console.error('Authentication complete error:', error);
    res.status(500).json({ error: 'Authentication verification failed' });
  }
});

// Delete user endpoint
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete user (authenticators will be deleted due to cascade)
    const deletedUser = await prisma.users.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
    } else {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`WebAuthn server with Prisma running on http://localhost:${PORT}`);
  console.log(`CORS enabled for: ${ORIGIN}`);
  console.log('Database: PostgreSQL with Prisma ORM');
});