const Advertisement = require('../models/Advertisement');

module.exports = {
    async find(params = {}) {
        const filter = { isDeleted: false };

        if (params.shortText) {
            filter.shortText = {
                $regex: params.shortText, $options: 'i'
            };
        }
        if (params.description) {
            filter.description = {
                $regex: params.description, $options: 'i'
            };
        }
        if (params.userId) {
            filter.userId = params.userId;
        }
        if (params.tags && Array.isArray(params.tags)) {
            filter.tags = { $all: params.tags };
        }

        const advertisements = await Advertisement.find(filter);
        return advertisements;
    },

    async create(data) {
        const { shortText, description, images, userId, tags } = data;

        const advertisement = new Advertisement({
            shortText,
            description: description || '',
            images: images || [],
            userId,
            tags: tags || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false,
        });

        await advertisement.save();
        return advertisement;
    },

    async remove(id) {
        const advertisement = await Advertisement.findByIdAndUpdate(
            id,
            {
                isDeleted: true,
                updatedAt: new Date()
            },
            {
                new: true
            }
        );

        if (!advertisement) {
            throw new Error('Advertisement not found');
        }
        return advertisement;
    },
};