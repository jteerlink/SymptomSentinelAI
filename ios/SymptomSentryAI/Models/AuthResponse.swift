import Foundation

/// Response from authentication endpoints (login and register)
struct AuthResponse: Codable {
    /// Authentication token (JWT)
    let token: String
    
    /// User data
    let user: UserData
    
    /// Response message
    let message: String?
    
    /// Coding keys to handle optional fields
    enum CodingKeys: String, CodingKey {
        case token
        case user
        case message
    }
    
    /// Custom decoder to handle optional fields
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        token = try container.decode(String.self, forKey: .token)
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