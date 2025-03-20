import Foundation
import Combine

/// Service for managing educational content
class EducationService: ObservableObject {
    /// Shared instance for singleton access
    static let shared = EducationService()
    
    /// Published collection of all educational content
    @Published private(set) var allContent: [EducationalContent] = []
    
    /// Published collection of saved content IDs
    @Published private(set) var savedContentIDs: Set<String> = []
    
    /// Published collection of viewed content IDs
    @Published private(set) var viewedContentIDs: Set<String> = []
    
    /// UserDefaults keys
    private enum UserDefaultsKeys {
        static let savedContent = "savedEducationalContent"
        static let viewedContent = "viewedEducationalContent"
    }
    
    /// Private initializer for singleton pattern
    private init() {
        loadContent()
        loadSavedContent()
        loadViewedContent()
    }
    
    /// Loads educational content from backend API (or sample data for now)
    func loadContent() {
        // In a real app, this would fetch from an API
        // For this demo, we'll use sample data
        self.allContent = EducationalContent.sampleContent()
    }
    
    /// Gets all available content
    func getAllContent() -> [EducationalContent] {
        return allContent
    }
    
    /// Filters content by category
    func getContent(for category: ContentCategory) -> [EducationalContent] {
        if category == .all {
            return allContent
        }
        return allContent.filter { $0.category == category }
    }
    
    /// Gets content filtered by category and search term
    func getContent(for category: ContentCategory, searchTerm: String) -> [EducationalContent] {
        let categoryFiltered = getContent(for: category)
        
        if searchTerm.isEmpty {
            return categoryFiltered
        }
        
        let lowercasedSearchTerm = searchTerm.lowercased()
        return categoryFiltered.filter { content in
            content.title.lowercased().contains(lowercasedSearchTerm) ||
            content.description.lowercased().contains(lowercasedSearchTerm) ||
            content.tags.contains { $0.lowercased().contains(lowercasedSearchTerm) } ||
            content.author.lowercased().contains(lowercasedSearchTerm)
        }
    }
    
    /// Gets featured content
    func getFeaturedContent() -> [EducationalContent] {
        return allContent.filter { $0.isFeatured }
    }
    
    /// Gets premium content
    func getPremiumContent() -> [EducationalContent] {
        return allContent.filter { $0.isPremiumOnly }
    }
    
    /// Gets content by type
    func getContent(ofType type: ContentType) -> [EducationalContent] {
        return allContent.filter { $0.type == type }
    }
    
    /// Gets content by ID
    func getContent(withID id: String) -> EducationalContent? {
        return allContent.first { $0.id == id }
    }
    
    /// Gets all saved content
    func getSavedContent() -> [EducationalContent] {
        return allContent.filter { savedContentIDs.contains($0.id) }
    }
    
    /// Toggles saved status for content
    func toggleSaved(contentID: String) {
        if savedContentIDs.contains(contentID) {
            savedContentIDs.remove(contentID)
        } else {
            savedContentIDs.insert(contentID)
        }
        saveSavedContent()
    }
    
    /// Checks if content is saved
    func isSaved(contentID: String) -> Bool {
        return savedContentIDs.contains(contentID)
    }
    
    /// Marks content as viewed
    func markAsViewed(contentID: String) {
        viewedContentIDs.insert(contentID)
        saveViewedContent()
        
        // Update content item
        if let index = allContent.firstIndex(where: { $0.id == contentID }) {
            allContent[index].hasBeenViewed = true
        }
    }
    
    /// Checks if content has been viewed
    func hasBeenViewed(contentID: String) -> Bool {
        return viewedContentIDs.contains(contentID)
    }
    
    /// Gets recently viewed content
    func getRecentlyViewedContent(limit: Int = 5) -> [EducationalContent] {
        return allContent.filter { viewedContentIDs.contains($0.id) }
            .prefix(limit)
            .map { $0 }
    }
    
    // MARK: - Private Helper Methods
    
    /// Saves saved content IDs to UserDefaults
    private func saveSavedContent() {
        UserDefaults.standard.set(Array(savedContentIDs), forKey: UserDefaultsKeys.savedContent)
    }
    
    /// Loads saved content IDs from UserDefaults
    private func loadSavedContent() {
        if let savedIDs = UserDefaults.standard.stringArray(forKey: UserDefaultsKeys.savedContent) {
            savedContentIDs = Set(savedIDs)
        }
    }
    
    /// Saves viewed content IDs to UserDefaults
    private func saveViewedContent() {
        UserDefaults.standard.set(Array(viewedContentIDs), forKey: UserDefaultsKeys.viewedContent)
    }
    
    /// Loads viewed content IDs from UserDefaults
    private func loadViewedContent() {
        if let viewedIDs = UserDefaults.standard.stringArray(forKey: UserDefaultsKeys.viewedContent) {
            viewedContentIDs = Set(viewedIDs)
        }
    }
    
    /// For testing: clears all saved and viewed content
    func resetUserData() {
        savedContentIDs = []
        viewedContentIDs = []
        UserDefaults.standard.removeObject(forKey: UserDefaultsKeys.savedContent)
        UserDefaults.standard.removeObject(forKey: UserDefaultsKeys.viewedContent)
    }
}