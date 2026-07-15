const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const passport = require('../config/passport');

const User = require('../models/User');

const UserModule = require('../modules/UserModule');
const AdvertisementModule = require('../modules/Advertisement');

const isAuthenticated = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const userDir = path.join('uploads', req.user._id.toString());
        require('fs').mkdirSync(userDir, { recursive: true });
        cb(null, userDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, contactPhone } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'email, password и name обязательны',
                status: 'error'
            });
        }

        const user = await UserModule.create({ email, password, name, contactPhone });

        return res.status(201).json({
            data: {
                id: user._id,
                email: user.email,
                name: user.name,
                contactPhone: user.contactPhone
            },
            status: 'ok'
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                error: 'email занят',
                status: 'error'
            });
        }
        console.error(err);
        return res.status(500).json({
            error: 'Внутренняя ошибка сервера',
            status: 'error'
        });
    }
});

router.post('/signin', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({
                error: info?.message || 'Неверный логин или пароль',
                status: 'error'
            });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.json({
                data: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    contactPhone: user.contactPhone
                },
                status: 'ok'
            });
        });
    })(req, res, next);
});

router.get('/advertisements', async (req, res) => {
    try {
        const { shortText, description, userId, tags } = req.query;
        const params = {};

        if (shortText) params.shortText = shortText;
        if (description) params.description = description;
        if (userId) params.userId = userId;
        if (tags) {
            params.tags = Array.isArray(tags) ? tags : tags.split(',');
        }

        const ads = await AdvertisementModule.find(params);

        const data = await Promise.all(ads.map(async (ad) => {
            const user = await User.findById(ad.userId).select('name');
            return {
                id: ad._id,
                shortTitle: ad.shortText,
                description: ad.description,
                images: ad.images,
                user: {
                    id: ad.userId,
                    name: user ? user.name : 'Unknown'
                },
                createdAt: ad.createdAt
            };
        }));

        return res.json({ data, status: 'ok' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка сервера', status: 'error' });
    }
});

router.get('/advertisements/:id', async (req, res) => {
    try {
        const ad = await AdvertisementModule.find({ _id: req.params.id });
        if (!ad.length || ad[0].isDeleted) {
            return res.status(404).json({ error: 'Объявление не найдено', status: 'error' });
        }

        const advertisement = ad[0];
        const user = await User.findById(advertisement.userId).select('name');

        const data = {
            id: advertisement._id,
            shortTitle: advertisement.shortText,
            description: advertisement.description,
            images: advertisement.images,
            user: {
                id: advertisement.userId,
                name: user ? user.name : 'Unknown'
            },
            createdAt: advertisement.createdAt
        };

        return res.json({ data, status: 'ok' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка сервера', status: 'error' });
    }
});

router.post('/advertisements', isAuthenticated, upload.array('images', 5), async (req, res) => {
    try {
        const { shortTitle, description, tags } = req.body;

        if (!shortTitle) {
            return res.status(400).json({ error: 'shortTitle обязателен', status: 'error' });
        }

        const images = req.files.map(file => `/uploads/${req.user._id}/${file.filename}`);

        const advertisement = await AdvertisementModule.create({
            shortText: shortTitle,
            description: description || '',
            images,
            userId: req.user._id,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
        });

        const user = await User.findById(req.user._id).select('name');

        return res.status(201).json({
            data: {
                id: advertisement._id,
                shortTitle: advertisement.shortText,
                description: advertisement.description,
                images: advertisement.images,
                user: {
                    id: req.user._id,
                    name: user.name
                },
                createdAt: advertisement.createdAt
            },
            status: 'ok'
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка сервера', status: 'error' });
    }
});

router.delete('/advertisements/:id', isAuthenticated, async (req, res) => {
    try {
        const ad = await AdvertisementModule.find({ _id: req.params.id });
        if (!ad.length || ad[0].isDeleted) {
            return res.status(404).json({ error: 'Объявление не найдено', status: 'error' });
        }

        const advertisement = ad[0];

        if (advertisement.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Нет прав на удаление', status: 'error' });
        }

        await AdvertisementModule.remove(req.params.id);

        return res.json({ success: true, status: 'ok' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка сервера', status: 'error' });
    }
});

module.exports = router;