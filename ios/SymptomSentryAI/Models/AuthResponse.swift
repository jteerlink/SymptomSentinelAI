import Foundation

/// Response from authentication endpoints (login and register)
struct AuthResponse: Codable {
    /// Authentication token (JWT)
    let token: String
    
    /// User data
    let user: UserData
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