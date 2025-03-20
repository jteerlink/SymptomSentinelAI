import Foundation

struct User: Codable, Identifiable {
    var id: String
    var name: String
    var email: String
    var phoneNumber: String?
    var subscriptionLevel: SubscriptionLevel
    var analysisHistory: [AnalysisRecord]
    var preferences: UserPreferences
    
    enum SubscriptionLevel: String, Codable, CaseIterable {
        case free
        case premium
        
        var displayName: String {
            switch self {
            case .free:
                return "Free"
            case .premium:
                return "Premium"
            }
        }
        
        var maxAnalysesPerMonth: Int {
            switch self {
            case .free:
                return 2
            case .premium:
                return Int.max // unlimited
            }
        }
        
        var hasAccessToPremiumContent: Bool {
            switch self {
            case .free:
                return false
            case .premium:
                return true
            }
        }
    }
    
    struct AnalysisRecord: Codable, Identifiable {
        var id: String
        var date: Date
        var type: AnalysisType
        var conditions: [AnalysisCondition]
        var imageReference: String? // Reference to stored image
        
        enum AnalysisType: String, Codable {
            case throat
            case ear
            
            var displayName: String {
                switch self {
                case .throat:
                    return "Throat"
                case .ear:
                    return "Ear"
                }
            }
            
            var iconName: String {
                switch self {
                case .throat:
                    return "waveform.path"
                case .ear:
                    return "ear"
                }
            }
        }
        
        // Computed property to get the top condition
        var topCondition: AnalysisCondition? {
            return conditions.max(by: { $0.confidence < $1.confidence })
        }
        
        // Format the date for display
        var formattedDate: String {
            let formatter = DateFormatter()
            formatter.dateStyle = .medium
            formatter.timeStyle = .short
            return formatter.string(from: date)
        }
    }
    
    // Function to check if user can perform another analysis this month
    func canPerformAnalysis() -> Bool {
        let currentMonthAnalyses = analysisHistory.filter { 
            Calendar.current.isDate($0.date, equalTo: Date(), toGranularity: .month)
        }
        
        return currentMonthAnalyses.count < subscriptionLevel.maxAnalysesPerMonth
    }
    
    // Number of analyses remaining this month
    func analysesRemainingThisMonth() -> Int {
        let currentMonthAnalyses = analysisHistory.filter { 
            Calendar.current.isDate($0.date, equalTo: Date(), toGranularity: .month)
        }
        
        return max(0, subscriptionLevel.maxAnalysesPerMonth - currentMonthAnalyses.count)
    }
}

struct UserPreferences: Codable {
    var notificationsEnabled: Bool
    var darkModeEnabled: Bool
    var dataUsageConsent: Bool
}