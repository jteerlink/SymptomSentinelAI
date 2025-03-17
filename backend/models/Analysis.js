/**
 * Analysis Model
 * 
 * In a real application, this would be a proper MongoDB/database model.
 * For this demo, we're using a simple JavaScript class.
 */
class Analysis {
    constructor(id, userId, type, conditions, imageReference = null) {
        this.id = id;
        this.userId = userId;
        this.type = type; // 'throat' or 'ear'
        this.conditions = conditions; // Array of condition objects with name, confidence, and description
        this.imageReference = imageReference; // Reference to the image storage (e.g., S3 URL)
        this.createdAt = new Date();
    }

    // Convert to JSON for API responses
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            conditions: this.conditions,
            createdAt: this.createdAt,
            imageReference: this.imageReference
        };
    }

    // Static method to validate analysis data
    static validate(analysisData) {
        const errors = [];

        if (!analysisData.type) {
            errors.push('Analysis type is required');
        } else if (!['throat', 'ear'].includes(analysisData.type)) {
            errors.push('Analysis type must be either "throat" or "ear"');
        }

        if (!analysisData.conditions || !Array.isArray(analysisData.conditions) || analysisData.conditions.length === 0) {
            errors.push('Conditions array is required and must not be empty');
        } else {
            // Validate each condition in the array
            analysisData.conditions.forEach((condition, index) => {
                if (!condition.name) {
                    errors.push(`Condition at index ${index} is missing a name`);
                }
                if (typeof condition.confidence !== 'number' || condition.confidence < 0 || condition.confidence > 1) {
                    errors.push(`Condition "${condition.name}" has an invalid confidence value (must be between 0 and 1)`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = Analysis;
