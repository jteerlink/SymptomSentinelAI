import Foundation
import SwiftUI

/// Model representing a medical condition identified during analysis
struct AnalysisCondition: Identifiable, Codable {
    // MARK: - Properties
    
    /// Unique identifier
    let id: String
    
    /// Condition name
    let name: String
    
    /// Confidence level (0.0-1.0)
    let confidence: Double
    
    /// Condition description
    let description: String
    
    /// Severity level
    let severity: ConditionSeverity
    
    /// Treatment recommendation
    let recommendation: String
    
    // MARK: - Computed Properties
    
    /// Confidence as percentage
    var confidencePercentage: Int {
        Int(confidence * 100)
    }
    
    /// Color based on confidence level
    var confidenceColor: String {
        if confidence >= 0.8 {
            return "red"
        } else if confidence >= 0.6 {
            return "orange"
        } else if confidence >= 0.4 {
            return "yellow"
        } else {
            return "green"
        }
    }
    
    // MARK: - Initialization
    
    init(id: String, name: String, confidence: Double, description: String, severity: ConditionSeverity, recommendation: String) {
        self.id = id
        self.name = name
        self.confidence = confidence
        self.description = description
        self.severity = severity
        self.recommendation = recommendation
    }
}

/// Severity level of a medical condition
enum ConditionSeverity: String, Codable {
    case mild = "mild"
    case moderate = "moderate"
    case severe = "severe"
    
    // MARK: - Computed Properties
    
    /// Display name for the severity level
    var displayName: String {
        switch self {
        case .mild:
            return "Mild"
        case .moderate:
            return "Moderate"
        case .severe:
            return "Severe"
        }
    }
    
    /// Color associated with the severity level
    var color: String {
        switch self {
        case .mild:
            return "green"
        case .moderate:
            return "orange"
        case .severe:
            return "red"
        }
    }
}