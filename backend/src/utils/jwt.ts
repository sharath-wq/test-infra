import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

// Generate a JWT token
export const generateToken = (userId: string) => {
    return jwt.sign({ id: userId }, SECRET_KEY, { expiresIn: '1h' });
};

// Verify a JWT token
export const verifyToken = (token: string) => {
    return jwt.verify(token, SECRET_KEY);
};