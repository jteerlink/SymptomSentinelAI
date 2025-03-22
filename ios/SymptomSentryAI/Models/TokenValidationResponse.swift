import Foundation

/// Response from token validation endpoint
struct TokenValidationResponse: Codable {
    /// Token validity status
    let valid: Bool
}