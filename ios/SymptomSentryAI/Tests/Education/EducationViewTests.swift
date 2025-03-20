import XCTest
@testable import SymptomSentryAI

/// Unit tests for educational content functionality
class EducationViewTests: XCTestCase {
    // MARK: - Properties
    
    /// Education service to test
    var educationService: EducationService!
    
    /// Sample content for testing
    var sampleContent: [EducationalContent]!
    
    /// Setup method run before each test
    override func setUp() {
        super.setUp()
        
        // Create a fresh instance of EducationService
        educationService = EducationService.shared
        educationService.resetUserData()
        
        // Get sample content
        sampleContent = EducationalContent.sampleContent()
    }
    
    /// Teardown method run after each test
    override func tearDown() {
        // Reset education service data
        educationService.resetUserData()
        
        educationService = nil
        sampleContent = nil
        
        super.tearDown()
    }
    
    // MARK: - Content Loading Tests
    
    /// Test that content loads correctly
    func testLoadContent() {
        // When
        let allContent = educationService.getAllContent()
        
        // Then
        XCTAssertFalse(allContent.isEmpty, "Content should not be empty")
        XCTAssertEqual(allContent.count, sampleContent.count, "Should load all sample content")
    }
    
    /// Test content filtering by category
    func testFilterContentByCategory() {
        // Given
        let throatCategory = ContentCategory.throat
        
        // When
        let throatContent = educationService.getContent(for: throatCategory)
        
        // Then
        XCTAssertFalse(throatContent.isEmpty, "Should find throat content")
        
        // Verify all returned content is from the throat category
        for content in throatContent {
            XCTAssertEqual(content.category, throatCategory, "Content should be from throat category")
        }
        
        // Verify we get the correct count
        let expectedCount = sampleContent.filter { $0.category == throatCategory }.count
        XCTAssertEqual(throatContent.count, expectedCount, "Should return all throat content")
    }
    
    /// Test content filtering by search term
    func testFilterContentBySearchTerm() {
        // Given
        let searchTerm = "strep"
        
        // When
        let searchResults = educationService.getContent(for: .all, searchTerm: searchTerm)
        
        // Then
        XCTAssertFalse(searchResults.isEmpty, "Should find content matching 'strep'")
        
        // Verify all returned content contains the search term
        for content in searchResults {
            let containsInTitle = content.title.lowercased().contains(searchTerm.lowercased())
            let containsInDescription = content.description.lowercased().contains(searchTerm.lowercased())
            let containsInTags = content.tags.contains { $0.lowercased().contains(searchTerm.lowercased()) }
            
            XCTAssertTrue(
                containsInTitle || containsInDescription || containsInTags,
                "Content should contain the search term somewhere"
            )
        }
    }
    
    /// Test filtering by category and search term together
    func testFilterContentByCategoryAndSearchTerm() {
        // Given
        let category = ContentCategory.throat
        let searchTerm = "infection"
        
        // When
        let filteredContent = educationService.getContent(for: category, searchTerm: searchTerm)
        
        // Then
        for content in filteredContent {
            XCTAssertEqual(content.category, category, "Content should be from the specified category")
            
            let containsInTitle = content.title.lowercased().contains(searchTerm.lowercased())
            let containsInDescription = content.description.lowercased().contains(searchTerm.lowercased())
            let containsInTags = content.tags.contains { $0.lowercased().contains(searchTerm.lowercased()) }
            
            XCTAssertTrue(
                containsInTitle || containsInDescription || containsInTags,
                "Content should contain the search term somewhere"
            )
        }
    }
    
    /// Test getting featured content
    func testGetFeaturedContent() {
        // When
        let featuredContent = educationService.getFeaturedContent()
        
        // Then
        XCTAssertFalse(featuredContent.isEmpty, "Should have featured content")
        
        // Verify all returned content is featured
        for content in featuredContent {
            XCTAssertTrue(content.isFeatured, "Content should be featured")
        }
        
        // Verify the count matches expected
        let expectedCount = sampleContent.filter { $0.isFeatured }.count
        XCTAssertEqual(featuredContent.count, expectedCount, "Should return all featured content")
    }
    
    /// Test getting content by type
    func testGetContentByType() {
        // Given
        let contentType = ContentType.video
        
        // When
        let videoContent = educationService.getContent(ofType: contentType)
        
        // Then
        XCTAssertFalse(videoContent.isEmpty, "Should have video content")
        
        // Verify all returned content is videos
        for content in videoContent {
            XCTAssertEqual(content.type, contentType, "Content should be videos")
        }
        
        // Verify the count matches expected
        let expectedCount = sampleContent.filter { $0.type == contentType }.count
        XCTAssertEqual(videoContent.count, expectedCount, "Should return all video content")
    }
    
    // MARK: - Saved Content Tests
    
    /// Test saving and unsaving content
    func testToggleSavedContent() {
        // Given
        let contentToSave = sampleContent[0]
        
        // Verify content is not saved initially
        XCTAssertFalse(educationService.isSaved(contentID: contentToSave.id), "Content should not be saved initially")
        
        // When - Save the content
        educationService.toggleSaved(contentID: contentToSave.id)
        
        // Then - Verify it's saved
        XCTAssertTrue(educationService.isSaved(contentID: contentToSave.id), "Content should be saved")
        
        // When - Unsave the content
        educationService.toggleSaved(contentID: contentToSave.id)
        
        // Then - Verify it's not saved
        XCTAssertFalse(educationService.isSaved(contentID: contentToSave.id), "Content should not be saved after toggle")
    }
    
    /// Test getting saved content
    func testGetSavedContent() {
        // Given - Save two content items
        let firstToSave = sampleContent[0]
        let secondToSave = sampleContent[1]
        
        educationService.toggleSaved(contentID: firstToSave.id)
        educationService.toggleSaved(contentID: secondToSave.id)
        
        // When
        let savedContent = educationService.getSavedContent()
        
        // Then
        XCTAssertEqual(savedContent.count, 2, "Should have 2 saved items")
        XCTAssertTrue(savedContent.contains { $0.id == firstToSave.id }, "Should contain first saved item")
        XCTAssertTrue(savedContent.contains { $0.id == secondToSave.id }, "Should contain second saved item")
    }
    
    // MARK: - Viewed Content Tests
    
    /// Test marking content as viewed
    func testMarkContentAsViewed() {
        // Given
        let contentToView = sampleContent[0]
        
        // Verify content is not viewed initially
        XCTAssertFalse(educationService.hasBeenViewed(contentID: contentToView.id), "Content should not be viewed initially")
        
        // When
        educationService.markAsViewed(contentID: contentToView.id)
        
        // Then
        XCTAssertTrue(educationService.hasBeenViewed(contentID: contentToView.id), "Content should be marked as viewed")
    }
    
    /// Test getting recently viewed content
    func testGetRecentlyViewedContent() {
        // Given - Mark three content items as viewed
        let firstViewed = sampleContent[0]
        let secondViewed = sampleContent[1]
        let thirdViewed = sampleContent[2]
        
        educationService.markAsViewed(contentID: firstViewed.id)
        educationService.markAsViewed(contentID: secondViewed.id)
        educationService.markAsViewed(contentID: thirdViewed.id)
        
        // When - Get two most recently viewed
        let recentlyViewed = educationService.getRecentlyViewedContent(limit: 2)
        
        // Then
        XCTAssertEqual(recentlyViewed.count, 2, "Should return only 2 items")
        XCTAssertTrue(
            educationService.hasBeenViewed(contentID: recentlyViewed[0].id),
            "All returned content should be marked as viewed"
        )
    }
    
    // MARK: - Educational Content Model Tests
    
    /// Test that content has essential properties
    func testContentModelProperties() {
        // Given
        let content = sampleContent[0]
        
        // Then
        XCTAssertFalse(content.id.isEmpty, "Content should have an ID")
        XCTAssertFalse(content.title.isEmpty, "Content should have a title")
        XCTAssertFalse(content.description.isEmpty, "Content should have a description")
        XCTAssertFalse(content.content.isEmpty, "Content should have content")
        XCTAssertFalse(content.author.isEmpty, "Content should have an author")
    }
    
    /// Test formatted duration
    func testFormattedDuration() {
        // Given
        let videoContent = sampleContent.first { $0.type == .video }!
        
        // Then
        XCTAssertNotNil(videoContent.formattedDuration, "Video should have a formatted duration")
        XCTAssertTrue(
            videoContent.formattedDuration!.contains("m") || videoContent.formattedDuration!.contains("s"),
            "Duration should be formatted with minutes (m) or seconds (s)"
        )
    }
    
    /// Test formatted date
    func testFormattedDate() {
        // Given
        let content = sampleContent[0]
        
        // Then
        XCTAssertFalse(content.formattedDate.isEmpty, "Content should have a formatted date")
    }
}