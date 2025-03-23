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
    
    /// Loading state
    @Published var isLoading = false
    
    /// Error message
    @Published var errorMessage: String?
    
    /// Network service for API requests
    private let networkService = NetworkService.shared
    
    /// Cancellable store for Combine subscriptions
    private var cancellables = Set<AnyCancellable>()
    
    /// UserDefaults keys
    private enum UserDefaultsKeys {
        static let savedContent = "savedEducationalContent"
        static let viewedContent = "viewedEducationalContent"
    }
    
    /// Private initializer for singleton pattern
    private init() {
        // Load local preferences first for immediate use
        loadSavedContent()
        loadViewedContent()
        
        // Load content
        loadContent()
        
        // Observe authentication state
        UserService.shared.$isAuthenticated
            .sink { [weak self] isAuthenticated in
                if isAuthenticated {
                    // User logged in, fetch their preferences from server
                    self?.loadUserPreferencesFromServer()
                }
            }
            .store(in: &cancellables)
    }
    
    /// Loads user preferences from the server (saved/viewed content)
    private func loadUserPreferencesFromServer() {
        guard let authToken = UserService.shared.authToken else {
            return
        }
        
        networkService.request(
            endpoint: "/api/educational/user/preferences",
            method: .get,
            parameters: nil
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { completionStatus in
                if case .failure(let error) = completionStatus {
                    print("Failed to load user preferences: \(error.localizedDescription)")
                }
            },
            receiveValue: { [weak self] data in
                guard let self = self else { return }
                
                do {
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let preferences = json["preferences"] as? [String: Any] {
                        
                        // Handle saved content IDs
                        if let savedIDs = preferences["saved_content"] as? [String] {
                            // Merge with local saved content
                            let newSavedIDs = Set(savedIDs)
                            self.savedContentIDs = self.savedContentIDs.union(newSavedIDs)
                            self.saveSavedContent()
                        }
                        
                        // Handle viewed content IDs
                        if let viewedIDs = preferences["viewed_content"] as? [String] {
                            // Merge with local viewed content
                            let newViewedIDs = Set(viewedIDs)
                            self.viewedContentIDs = self.viewedContentIDs.union(newViewedIDs)
                            self.saveViewedContent()
                            
                            // Update content items
                            for contentID in newViewedIDs {
                                if let index = self.allContent.firstIndex(where: { $0.id == contentID }) {
                                    self.allContent[index].hasBeenViewed = true
                                }
                            }
                        }
                    }
                } catch {
                    print("Failed to parse user preferences: \(error.localizedDescription)")
                }
            }
        )
        .store(in: &cancellables)
    }
    
    /// Loads educational content from backend API
    func loadContent() {
        isLoading = true
        errorMessage = nil
        
        // Fetch educational content from the backend API
        networkService.request(
            endpoint: "/api/educational/content",
            method: .get,
            parameters: nil
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completionStatus in
                guard let self = self else { return }
                self.isLoading = false
                
                if case .failure(let error) = completionStatus {
                    self.errorMessage = error.localizedDescription
                    // Fall back to sample content if API fails
                    if self.allContent.isEmpty {
                        self.allContent = EducationalContent.sampleContent()
                    }
                }
            },
            receiveValue: { [weak self] data in
                guard let self = self else { return }
                self.isLoading = false
                
                do {
                    // Parse JSON response
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let contentData = json["content"] as? [[String: Any]] {
                        
                        var contentItems: [EducationalContent] = []
                        
                        for itemData in contentData {
                            if let id = itemData["id"] as? String,
                               let title = itemData["title"] as? String,
                               let description = itemData["description"] as? String,
                               let categoryString = itemData["category"] as? String,
                               let category = ContentCategory(rawValue: categoryString),
                               let typeString = itemData["type"] as? String,
                               let type = ContentType(rawValue: typeString),
                               let imageUrl = itemData["image_url"] as? String,
                               let author = itemData["author"] as? String,
                               let tags = itemData["tags"] as? [String],
                               let isFeatured = itemData["is_featured"] as? Bool,
                               let isPremiumOnly = itemData["is_premium_only"] as? Bool,
                               let content = itemData["content"] as? String {
                                
                                let item = EducationalContent(
                                    id: id,
                                    title: title,
                                    description: description,
                                    category: category,
                                    type: type,
                                    imageUrl: imageUrl,
                                    author: author,
                                    tags: tags,
                                    isFeatured: isFeatured,
                                    isPremiumOnly: isPremiumOnly,
                                    content: content,
                                    hasBeenViewed: self.viewedContentIDs.contains(id)
                                )
                                
                                contentItems.append(item)
                            }
                        }
                        
                        self.allContent = contentItems
                    } else {
                        self.errorMessage = "Invalid server response"
                        // Fall back to sample content if API response is invalid
                        if self.allContent.isEmpty {
                            self.allContent = EducationalContent.sampleContent()
                        }
                    }
                } catch {
                    self.errorMessage = "Failed to parse response: \(error.localizedDescription)"
                    // Fall back to sample content if parsing fails
                    if self.allContent.isEmpty {
                        self.allContent = EducationalContent.sampleContent()
                    }
                }
            }
        )
        .store(in: &cancellables)
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
        // Update local state first for immediate UI feedback
        let wasSaved = savedContentIDs.contains(contentID)
        
        if wasSaved {
            savedContentIDs.remove(contentID)
        } else {
            savedContentIDs.insert(contentID)
        }
        
        // Save to local storage
        saveSavedContent()
        
        // If the user is authenticated, sync with the backend
        if let authToken = UserService.shared.authToken {
            // Prepare request parameters
            let parameters: [String: Any] = [
                "content_id": contentID,
                "saved": !wasSaved
            ]
            
            // Send the update to the backend
            networkService.request(
                endpoint: "/api/educational/user/preferences",
                method: .post,
                parameters: parameters
            )
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completionStatus in
                    if case .failure(let error) = completionStatus {
                        print("Failed to sync saved status: \(error.localizedDescription)")
                    }
                },
                receiveValue: { _ in
                    // Successfully synced with backend
                }
            )
            .store(in: &cancellables)
        }
    }
    
    /// Checks if content is saved
    func isSaved(contentID: String) -> Bool {
        return savedContentIDs.contains(contentID)
    }
    
    /// Marks content as viewed
    func markAsViewed(contentID: String) {
        // Update local state first
        viewedContentIDs.insert(contentID)
        saveViewedContent()
        
        // Update content item in local collection
        if let index = allContent.firstIndex(where: { $0.id == contentID }) {
            allContent[index].hasBeenViewed = true
        }
        
        // If the user is authenticated, sync with the backend
        if let authToken = UserService.shared.authToken {
            // Prepare request parameters
            let parameters: [String: Any] = [
                "content_id": contentID,
                "viewed": true
            ]
            
            // Send the update to the backend
            networkService.request(
                endpoint: "/api/educational/user/preferences",
                method: .post,
                parameters: parameters
            )
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completionStatus in
                    if case .failure(let error) = completionStatus {
                        print("Failed to sync viewed status: \(error.localizedDescription)")
                    }
                },
                receiveValue: { _ in
                    // Successfully synced with backend
                }
            )
            .store(in: &cancellables)
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
    
    /// Clears all saved and viewed content locally and on the server
    func resetUserData() {
        // Clear local data
        savedContentIDs = []
        viewedContentIDs = []
        UserDefaults.standard.removeObject(forKey: UserDefaultsKeys.savedContent)
        UserDefaults.standard.removeObject(forKey: UserDefaultsKeys.viewedContent)
        
        // Update content items
        for i in 0..<allContent.count {
            allContent[i].hasBeenViewed = false
        }
        
        // If the user is authenticated, clear data on the server too
        if let authToken = UserService.shared.authToken {
            networkService.request(
                endpoint: "/api/educational/user/preferences/reset",
                method: .post,
                parameters: nil
            )
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completionStatus in
                    if case .failure(let error) = completionStatus {
                        print("Failed to reset user preferences on server: \(error.localizedDescription)")
                    }
                },
                receiveValue: { _ in
                    // Successfully reset on server
                }
            )
            .store(in: &cancellables)
        }
    }
}