import Foundation

/// Response from subscription update endpoint
struct SubscriptionResponse: Codable {
    /// Success indicator
    let success: Bool
    
    /// User data
    let user: UserData
}