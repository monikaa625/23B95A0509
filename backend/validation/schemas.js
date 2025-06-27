const Joi = require('joi');

const createUrlSchema = Joi.object({
    url: Joi.string()
        .uri({ scheme: ['http', 'https'] })
        .required()
        .messages({
            'string.uri': 'URL must be a valid HTTP or HTTPS URL',
            'any.required': 'URL is required'
        }),
    
    shortcode: Joi.string()
        .alphanum()
        .min(3)
        .max(10)
        .optional()
        .messages({
            'string.alphanum': 'Shortcode must contain only alphanumeric characters',
            'string.min': 'Shortcode must be at least 3 characters long',
            'string.max': 'Shortcode must not exceed 10 characters'
        }),
    
    validity: Joi.number()
        .integer()
        .min(1)
        .max(525600) // 1 year in minutes
        .default(30)
        .messages({
            'number.base': 'Validity must be a number',
            'number.integer': 'Validity must be an integer',
            'number.min': 'Validity must be at least 1 minute',
            'number.max': 'Validity cannot exceed 1 year (525600 minutes)'
        })
});

const shortCodeSchema = Joi.object({
    shortCode: Joi.string()
        .alphanum()
        .min(3)
        .max(10)
        .required()
        .messages({
            'string.alphanum': 'Short code must contain only alphanumeric characters',
            'string.min': 'Short code must be at least 3 characters long',
            'string.max': 'Short code must not exceed 10 characters',
            'any.required': 'Short code is required'
        })
});

module.exports = {
    createUrlSchema,
    shortCodeSchema
};
