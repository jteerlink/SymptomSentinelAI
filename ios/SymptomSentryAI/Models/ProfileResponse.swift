import Foundation

/// Response from user profile endpoints
struct ProfileResponse: Codable {
    /// User data
    let user: UserData
}