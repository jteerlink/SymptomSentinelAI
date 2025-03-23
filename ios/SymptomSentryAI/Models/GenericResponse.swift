import Foundation

/// Generic API response model for simple success/failure responses
struct GenericResponse: Codable {
    /// Whether the request was successful
    let success: Bool
    
    /// Optional message from the server (often used for error messages)
    let message: String?
    
    /// Optional data returned from the server
    let data: [String: String]?
}