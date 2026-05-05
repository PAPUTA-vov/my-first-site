const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Проверка аутентификации
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error();
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            throw new Error();
        }
        
        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Пожалуйста, авторизуйтесь' });
    }
};

// Проверка роли admin
const admin = async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора' });
    }
};

module.exports = { auth, admin };