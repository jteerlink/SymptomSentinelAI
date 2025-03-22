import Foundation

/// Response from saving analysis results
struct SaveAnalysisResponse: Codable {
    /// Success indicator
    let success: Bool
    
    /// Analysis ID (if successful)
    let analysis_id: String?
    
    /// Error message (if failure)
    let message: String?
}