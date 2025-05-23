/**
 * Analysis Model
 * 
 * In a real application, this would be a proper database model.
 * For this demo, we're using a simple JavaScript class.
 */
class Analysis {
    constructor(id, userId, type, conditions, imageUrl = null, createdAt = new Date()) {
        this.id = id;
        this.user_id = userId;
        this.type = type;
        this.conditions = conditions;
        this.image_url = imageUrl;
        this.created_at = createdAt;
    }

    // Convert to JSON for API responses
    toJSON() {
        return {
            id: this.id,
            userId: this.user_id,
            type: this.type,
            conditions: this.conditions,
            imageUrl: this.image_url,
            createdAt: this.created_at
        };
    }

    // Static method to create a new analysis
    static async create({ id, userId, type, conditions, imageUrl = null }) {
        // In a real implementation, this would insert into the database
        console.log(`Creating analysis: ${type} for user ${userId}`);
        
        // For demonstration purposes, return a mock analysis
        return new Analysis(
            id || 'mock-analysis-id',
            userId,
            type,
            conditions,
            imageUrl,
            new Date()
        );
    }

    // Static method to find analyses by user ID
    static async findByUserId(userId, options = {}) {
        // In a real implementation, this would query the database
        console.log(`Finding analyses for user ${userId} with options:`, options);
        
        // For demonstration purposes, return an empty array
        return [];
    }
    
    // Static method to find a specific analysis by ID
    static async findById(id, userId = null) {
        // In a real implementation, this would query the database for an analysis with the given ID
        // that belongs to the specified user (security check)
        if (process.env.NODE_ENV !== 'test') {
            console.log(`Finding analysis ${id}${userId ? ` for user ${userId}` : ''}`);
        }
        
        // For test environment, log inputs to help debug
        if (process.env.NODE_ENV === 'test') {
            console.log(`Analysis lookup requested - ID: ${id}, User ID: ${userId || 'not provided'}`);
        }
        
        // Special handling for unit test mocks
        // The mock will override this implementation in tests
        if (process.env.NODE_ENV === 'test' && global.__mockAnalysisData) {
            return global.__mockAnalysisData;
        }
        
        // For demonstration purposes, return a mock analysis
        // In production, this would return null if not found
        return new Analysis(
            id,
            userId || 'default-user', // Make sure we always have a user ID
            'throat', // mock type
            [
                {
                    id: 'strep_throat',
                    name: 'Strep Throat',
                    confidence: 0.78,
                    description: 'A bacterial infection that causes inflammation and pain in the throat.',
                    symptoms: ['Throat pain', 'Red and swollen tonsils'],
                    isPotentiallySerious: true
                }
            ],
            null, // imageUrl
            new Date() // createdAt
        );
    }

    // Static method to delete an analysis by ID
    static async deleteById(id, userId) {
        // In a real implementation, this would delete from the database
        console.log(`Deleting analysis ${id} for user ${userId}`);
        
        // For demonstration purposes, return success
        return { success: true };
    }
    
    // Static method to delete all analyses for a user
    static async deleteByUserId(userId) {
        // In a real implementation, this would delete all analyses for a user from the database
        console.log(`Deleting all analyses for user ${userId}`);
        
        // For demonstration purposes, return success
        return { success: true, count: 0 };
    }
}

module.exports = Analysis;