import Foundation

struct EducationalContent: Codable, Identifiable {
    var id: String
    var title: String
    var summary: String
    var category: ContentCategory
    var readTime: Int // in minutes
    var content: [String] // paragraphs
    var imageNames: [String]?
    var lastUpdated: Date
    var isPremiumContent: Bool
    
    enum ContentCategory: String, Codable, CaseIterable {
        case throat = "Throat"
        case ear = "Ear" 
        case prevention = "Prevention"
        case treatment = "Treatment"
        
        var iconName: String {
            switch self {
            case .throat:
                return "waveform.path"
            case .ear:
                return "ear"
            case .prevention:
                return "heart.text.square"
            case .treatment:
                return "cross.case"
            }
        }
        
        var displayColor: String {
            switch self {
            case .throat:
                return "blue"
            case .ear:
                return "purple"
            case .prevention:
                return "green"
            case .treatment:
                return "orange"
            }
        }
    }
    
    var displayImageName: String {
        return imageNames?.first ?? category.iconName
    }
    
    // Generate formatted read time (e.g., "5 min read")
    var formattedReadTime: String {
        return "\(readTime) min read"
    }
}