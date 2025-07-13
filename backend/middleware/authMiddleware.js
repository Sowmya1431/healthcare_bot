const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ msg: 'No token, access denied' });

    // Expecting format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No token, access denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: decoded.userId }; // or just decoded if you want all info
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Invalid token' });
    }
};