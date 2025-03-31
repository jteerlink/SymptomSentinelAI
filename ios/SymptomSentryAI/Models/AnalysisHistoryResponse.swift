import Foundation

/// Response from analysis history endpoint
struct AnalysisHistoryResponse: Codable {
    /// Analysis history items
    let history: [AnalysisHistoryData]
}

/// Analysis history item data
struct AnalysisHistoryData: Codable {
    /// Unique identifier
    let id: String
    
    /// Analysis date (ISO string)
    let date: String
    
    /// Analysis type (throat, ear)
    let type: String
    
    /// Reference to the image that was analyzed
    let image_reference: String
    
    /// Conditions detected in the analysis
    let conditions: [AnalysisConditionData]
}

/// Analysis condition data in history response
struct AnalysisConditionData: Codable {
    /// Unique identifier
    let id: String
    
    /// Condition name
    let name: String
    
    /// Confidence score (0.0 to 1.0)
    let confidence: Double
    
    /// Condition description
    let description: String
    
    /// Severity level
    let severity: String
    
    /// Recommendation for the condition
    let recommendation: String
    
    /// URL for attention map visualization (if available)
    let attentionMap: String?
    
    /// List of symptoms for this condition
    let symptoms: [String]?
}