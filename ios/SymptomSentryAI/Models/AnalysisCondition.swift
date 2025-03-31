import Foundation

/// Model representing a medical condition identified by image analysis
struct AnalysisCondition: Identifiable, Codable, Hashable {
    /// Unique identifier for the condition
    let id: String
    
    /// Human-readable name of the condition
    let name: String
    
    /// Detailed description of the condition
    let description: String
    
    /// Confidence score (0.0 to 1.0) representing how likely this condition is
    let confidence: Double
    
    /// List of common symptoms associated with this condition
    let symptoms: [String]
    
    /// Flag indicating if the condition requires urgent medical attention
    let isPotentiallySerious: Bool
    
    /// URL for the attention map image (if available)
    let attentionMapURL: String?
    
    /// Formatted confidence percentage for display
    var confidencePercentage: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .percent
        formatter.maximumFractionDigits = 1
        return formatter.string(from: NSNumber(value: confidence)) ?? "\(Int(confidence * 100))%"
    }
    
    /// Badge color based on confidence level
    var confidenceBadgeColor: String {
        if confidence >= 0.7 {
            return "red"
        } else if confidence >= 0.4 {
            return "yellow"
        } else {
            return "green"
        }
    }
    
    /// Determines if the condition warrants highlighting
    var isHighConfidence: Bool {
        return confidence >= 0.6
    }
    
    /// Determines if the condition has an attention map available
    var hasAttentionMap: Bool {
        return attentionMapURL != nil && !attentionMapURL!.isEmpty
    }
}

/// Complete analysis response from the server
struct AnalysisResponse: Codable {
    /// Unique identifier for this analysis
    let id: String
    
    /// Type of analysis performed (throat, ear, etc.)
    let type: String
    
    /// ISO timestamp when the analysis was performed
    let timestamp: String
    
    /// List of conditions identified in the analysis
    let conditions: [AnalysisCondition]
    
    /// Formatted date for display
    var formattedDate: String {
        if let date = ISO8601DateFormatter().date(from: timestamp) {
            let formatter = DateFormatter()
            formatter.dateStyle = .medium
            formatter.timeStyle = .short
            return formatter.string(from: date)
        }
        return timestamp
    }
}

/// Mock data for previews and testing
extension AnalysisCondition {
    static var mockData: [AnalysisCondition] = [
        AnalysisCondition(
            id: "strep_throat",
            name: "Strep Throat",
            description: "A bacterial infection that causes inflammation and pain in the throat.",
            confidence: 0.85,
            symptoms: [
                "Throat pain that comes on quickly",
                "Red and swollen tonsils",
                "White patches on the tonsils",
                "Tiny red spots on the roof of the mouth",
                "Fever"
            ],
            isPotentiallySerious: true,
            attentionMapURL: "https://api.symptomsentry.com/attention_maps/123e4567-e89b-12d3-a456-426614174000.png"
        ),
        AnalysisCondition(
            id: "tonsillitis",
            name: "Tonsillitis",
            description: "Inflammation of the tonsils, typically caused by viral or bacterial infection.",
            confidence: 0.65,
            symptoms: [
                "Red, swollen tonsils",
                "White or yellow coating on tonsils",
                "Sore throat",
                "Painful swallowing",
                "Fever"
            ],
            isPotentiallySerious: false,
            attentionMapURL: nil
        ),
        AnalysisCondition(
            id: "pharyngitis",
            name: "Pharyngitis",
            description: "Inflammation of the pharynx resulting in a sore throat.",
            confidence: 0.35,
            symptoms: [
                "Sore throat",
                "Difficulty swallowing",
                "Fever",
                "Enlarged lymph nodes"
            ],
            isPotentiallySerious: false,
            attentionMapURL: nil
        )
    ]
}

extension AnalysisResponse {
    static var mockData: AnalysisResponse = AnalysisResponse(
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "throat",
        timestamp: "2025-03-20T15:35:42.123456",
        conditions: AnalysisCondition.mockData
    )
}