/**
 * Symptom Assessment Controller
 * 
 * This controller handles all API endpoints related to manual symptom entry
 * and assessment without image analysis.
 */

const ApiError = require('../utils/apiError');
const getConditionsData = require('../utils/conditionsData');
const Analysis = require('../db/models/Analysis'); // Use the real database implementation
const { v4: uuidv4 } = require('uuid');

/**
 * Get all available conditions for a specific type (throat or ear)
 * 
 * @route GET /api/conditions/:type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getConditionsForType = async (req, res, next) => {
    try {
        const { type } = req.params;
        
        if (!type || (type !== 'throat' && type !== 'ear')) {
            return next(ApiError.badRequest('Invalid condition type. Must be "throat" or "ear".'));
        }
        
        // Get conditions data for the requested type
        const conditions = getConditionsData(type);
        
        return res.status(200).json({
            success: true,
            conditions
        });
    } catch (error) {
        console.error('Error getting conditions:', error);
        return next(ApiError.serverError('Failed to retrieve conditions data'));
    }
};

/**
 * Get all possible symptoms from our database of conditions
 * 
 * @route GET /api/symptoms
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllSymptoms = async (req, res, next) => {
    try {
        // Get all symptoms from all conditions (throat and ear)
        const throatConditions = getConditionsData('throat');
        const earConditions = getConditionsData('ear');
        
        // Extract all symptoms from all conditions and remove duplicates
        const allSymptoms = new Set();
        
        // Add throat symptoms
        throatConditions.forEach(condition => {
            condition.symptoms.forEach(symptom => {
                allSymptoms.add(symptom);
            });
        });
        
        // Add ear symptoms
        earConditions.forEach(condition => {
            condition.symptoms.forEach(symptom => {
                allSymptoms.add(symptom);
            });
        });
        
        // Convert the Set to Array and sort alphabetically
        const uniqueSymptoms = Array.from(allSymptoms).sort();
        
        return res.status(200).json({
            success: true,
            symptoms: uniqueSymptoms
        });
    } catch (error) {
        console.error('Error getting symptoms:', error);
        return next(ApiError.serverError('Failed to retrieve symptoms data'));
    }
};

/**
 * Analyze symptoms provided by the user
 * 
 * @route POST /api/analyze-symptoms
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.analyzeSymptoms = async (req, res, next) => {
    try {
        const { type, symptoms } = req.body;
        
        // Validate input
        if (!type || (type !== 'throat' && type !== 'ear')) {
            return next(ApiError.badRequest('Invalid analysis type. Must be "throat" or "ear".'));
        }
        
        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
            return next(ApiError.badRequest('Please provide at least one symptom for analysis.'));
        }
        
        // Get conditions for the specified type
        const conditions = getConditionsData(type);
        
        // Calculate match scores for each condition
        const conditionResults = conditions.map(condition => {
            // Calculate how many symptoms match
            const matchingSymptoms = condition.symptoms.filter(s => symptoms.includes(s));
            
            // Calculate confidence score (percentage of condition's symptoms that match)
            // We weight by both how many symptoms match and how specific the match is
            const specificityScore = matchingSymptoms.length / condition.symptoms.length;
            const coverageScore = matchingSymptoms.length / symptoms.length;
            
            // Weighted average with more emphasis on specificity
            const confidence = (specificityScore * 0.7) + (coverageScore * 0.3);
            
            return {
                id: condition.id,
                name: condition.name,
                description: condition.description,
                symptoms: condition.symptoms,
                matchingSymptoms: matchingSymptoms,
                confidence: confidence,
                treatmentOptions: condition.treatmentOptions,
                prevention: condition.prevention,
                isPotentiallySerious: condition.isPotentiallySerious || false
            };
        });
        
        // Filter out conditions with very low confidence (less than 10%)
        const filteredResults = conditionResults.filter(c => c.confidence >= 0.1);
        
        // Sort by confidence score (highest first)
        filteredResults.sort((a, b) => b.confidence - a.confidence);
        
        // Construct response with user inputs and analysis results
        const analysisResult = {
            type,
            userSymptoms: symptoms,
            conditions: filteredResults,
            timestamp: new Date().toISOString(),
            analysisId: uuidv4(), // Generate a unique ID for this analysis
            analysisType: 'symptom-assessment'
        };
        
        return res.status(200).json({
            success: true,
            ...analysisResult
        });
    } catch (error) {
        console.error('Error analyzing symptoms:', error);
        return next(ApiError.serverError('Failed to analyze symptoms'));
    }
};

/**
 * Save a symptom assessment result to the database
 * 
 * @route POST /api/save-symptom-assessment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.saveSymptomAssessment = async (req, res, next) => {
    try {
        // Get the user ID from the request object, handling different field names
        const userId = req.user.id || req.user.userId;
        
        if (!userId) {
            console.error('No user ID found in token payload:', req.user);
            return next(ApiError.badRequest('Invalid user identification in token.'));
        }
        
        const analysisData = req.body;
        
        // Validate required fields
        if (!analysisData.type || !analysisData.userSymptoms || !analysisData.conditions) {
            return next(ApiError.badRequest('Invalid analysis data. Missing required fields.'));
        }
        
        // Use the correct field names for the database model
        // Store all assessment data in the "conditions" field
        const assessmentData = {
            userSymptoms: analysisData.userSymptoms,
            conditions: analysisData.conditions,
            timestamp: analysisData.timestamp || new Date().toISOString(),
            analysisType: 'symptom-assessment'
        };
        
        console.log(`Saving symptom assessment for user ${userId} with ID ${analysisData.analysisId}`);
        console.log(`User object from token:`, req.user);

        try {
            // Create analysis record in the database using the proper field names
            // Note: The Model expects camelCase field names
            console.log(`Saving symptom assessment with user ID: ${userId}`);
            
            const analysisRecord = await Analysis.create({
                id: analysisData.analysisId || uuidv4(), // Use the ID generated during analysis
                userId: userId, // Pass the user ID to the database model
                type: analysisData.type,
                conditions: assessmentData, // Store the complete assessment data here
                imageUrl: null // No image for symptom assessment
            });
            
            console.log(`Created analysis record with ID: ${analysisRecord.id}, user_id: ${analysisRecord.user_id}`);
            
            return res.status(201).json({
                success: true,
                message: 'Symptom assessment saved successfully',
                analysisId: analysisRecord.id // Return the correct ID field
            });
        } catch (dbError) {
            console.error('Database error saving symptom assessment:', dbError);
            return next(ApiError.serverError(`Database error: ${dbError.message}`));
        }
    } catch (error) {
        console.error('Error saving symptom assessment:', error);
        return next(ApiError.serverError('Failed to save symptom assessment'));
    }
};