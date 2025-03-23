import Foundation

/// Response from authentication endpoints (login and register)
struct AuthResponse: Codable {
    /// Authentication token (JWT)
    let token: String
    
    /// Refresh token for getting new access tokens
    let refreshToken: String?
    
    /// Token expiration time (e.g., "1h")
    let tokenExpiration: String?
    
    /// User data
    let user: UserData
    
    /// Response message
    let message: String?
    
    /// Coding keys to handle optional fields
    enum CodingKeys: String, CodingKey {
        case token = "accessToken"
        case refreshToken
        case tokenExpiration
        case user
        case message
    }
    
    /// Custom decoder to handle optional fields
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Try to decode as "accessToken" first, then fall back to "token" if needed
        if container.contains(.token) {
            token = try container.decode(String.self, forKey: .token)
        } else {
            // Check for legacy "token" key
            let legacyToken = try container.decode(String.self, forKey: CodingKeys(stringValue: "token")!)
            token = legacyToken
        }
        
        refreshToken = try container.decodeIfPresent(String.self, forKey: .refreshToken)
        tokenExpiration = try container.decodeIfPresent(String.self, forKey: .tokenExpiration)
        user = try container.decode(UserData.self, forKey: .user)
        message = try container.decodeIfPresent(String.self, forKey: .message)
    }
}

/// User data returned from the server
struct UserData: Codable {
    /// User ID
    let id: String
    
    /// User email address
    let email: String
    
    /// User's full name
    let name: String
    
    /// Subscription level (free, premium)
    let subscription: String
}