import Foundation

/// Response from the image analysis API endpoint
struct AnalysisAPIResponse: Codable {
    /// Success indicator
    let success: Bool
    
    /// Error message (if failure)
    let message: String?
    
    /// Analysis results (if successful)
    let results: AnalysisResults?
    
    /// Convert API response to the app's internal AnalysisResponse model
    func toAnalysisResponse() -> AnalysisResponse? {
        guard success, let results = results else {
            return nil
        }
        
        // Map API condition data to app condition models
        let mappedConditions = results.conditions.map { conditionData -> AnalysisCondition in
            return AnalysisCondition(
                id: conditionData.id,
                name: conditionData.name,
                description: conditionData.description,
                confidence: conditionData.confidence,
                symptoms: conditionData.symptoms ?? [],
                isPotentiallySerious: conditionData.severity == "high"
            )
        }
        
        // Create a UUID for the analysis
        let analysisId = UUID().uuidString
        
        return AnalysisResponse(
            id: analysisId,
            type: results.type,
            timestamp: results.timestamp,
            conditions: mappedConditions
        )
    }
}

/// Analysis results returned from API
struct AnalysisResults: Codable {
    /// Type of analysis performed
    let type: String
    
    /// Detected conditions with confidence scores
    let conditions: [AnalysisConditionData]
    
    /// Timestamp of the analysis
    let timestamp: String
}