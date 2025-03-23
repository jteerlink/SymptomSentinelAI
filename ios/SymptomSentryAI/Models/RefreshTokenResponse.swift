import Foundation

/// Response from token refresh endpoint
struct RefreshTokenResponse: Codable {
    /// Whether the token refresh was successful
    let success: Bool
    
    /// New access token (if successful)
    let accessToken: String
    
    /// New refresh token (if provided)
    let refreshToken: String?
    
    /// Optional message (usually for errors)
    let message: String?
}