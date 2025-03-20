import XCTest

/// UI tests for education functionality
class EducationUITests: XCTestCase {
    // MARK: - Properties
    
    /// App under test
    var app: XCUIApplication!
    
    // MARK: - Setup
    
    /// Setup before each test
    override func setUp() {
        super.setUp()
        
        // Initialize the app with UI testing configuration
        app = XCUIApplication()
        
        // Set up UI testing arguments
        app.launchArguments = ["UI-TESTING", "RESET-ALL-TUTORIALS"]
        
        // Enable failure screenshots
        continueAfterFailure = false
        
        // Launch the app before each test
        app.launch()
    }
    
    // MARK: - Tests
    
    /// Test navigating to education tab
    func testNavigateToEducationTab() {
        // When - Tap on the Education tab
        app.tabBars.buttons["Education"].tap()
        
        // Then - Verify the education screen is shown
        XCTAssertTrue(app.navigationBars["Education"].exists, "Should show the education navigation bar")
        XCTAssertTrue(app.otherElements["educationSearchBar"].exists, "Should show the search bar")
    }
    
    /// Test searching for content
    func testSearchContent() {
        // Given - Navigate to education tab
        app.tabBars.buttons["Education"].tap()
        
        // When - Type in the search field
        let searchField = app.textFields["Search educational content..."]
        searchField.tap()
        searchField.typeText("throat")
        
        // Then - Verify search results appear
        // This is difficult to test precisely without element identifiers, but we can check for expected UI elements
        // Wait a moment for search to complete
        sleep(1)
        
        // Verify results are shown (this depends on how your UI is structured)
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'results'")).firstMatch.exists,
                     "Should show search results count")
    }
    
    /// Test filtering content by category
    func testFilterByCategory() {
        // Given - Navigate to education tab
        app.tabBars.buttons["Education"].tap()
        
        // When - Tap on a category (e.g., Throat)
        app.buttons["categoryThroat"].tap()
        
        // Then - Verify category is selected (visual indicator)
        // This is difficult to test precisely without specific accessibility markers
        // But we can check if the filter has been applied by checking for expected results
        sleep(1)
        
        // Can check if the results update accordingly
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'results'")).firstMatch.exists,
                     "Should show filtered results count")
    }
    
    /// Test opening filter view
    func testOpenFilterView() {
        // Given - Navigate to education tab
        app.tabBars.buttons["Education"].tap()
        
        // When - Tap on the filter button
        app.buttons["filterButton"].tap()
        
        // Then - Verify filter sheet appears
        XCTAssertTrue(app.navigationBars["Filter"].exists, "Should show the filter sheet")
        XCTAssertTrue(app.buttons["Done"].exists, "Should show done button in filter view")
    }
    
    /// Test toggling save content
    func testToggleSaveContent() {
        // Given - Navigate to education tab
        app.tabBars.buttons["Education"].tap()
        
        // When - Tap on the save button for the first content item
        // This is tricky because we need to identify specific save buttons
        // Assuming we have a saveButton1 accessibility identifier
        if let saveButton = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'saveButton'")).firstMatch {
            saveButton.tap()
            
            // Then - Verify the button changes state (visually it would show filled bookmark)
            // We can tap it again to toggle back
            saveButton.tap()
        } else {
            XCTFail("Could not find any save buttons")
        }
    }
    
    /// Test toggling saved content filter
    func testToggleSavedContentFilter() {
        // Given - Navigate to education tab
        app.tabBars.buttons["Education"].tap()
        
        // First save at least one item
        if let saveButton = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'saveButton'")).firstMatch {
            saveButton.tap()
            
            // When - Toggle to show only saved content
            app.buttons["savedToggleButton"].tap()
            
            // Then - Verify saved content is displayed
            // This is difficult to verify precisely, but we should see the content we just saved
            sleep(1)
            
            // Can check for results count
            XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'results'")).firstMatch.exists,
                         "Should show filtered results count for saved content")
            
            // When - Toggle back to show all content
            app.buttons["savedToggleButton"].tap()
        } else {
            XCTFail("Could not find any save buttons")
        }
    }
    
    /// Test opening content details
    func testOpenContentDetails() {
        // Given - Navigate to education tab
        app.tabBars.buttons["Education"].tap()
        
        // When - Tap on the first content card to open details
        // Find and tap the first content item (this depends on UI structure)
        // Using a simple approach - find all text elements and tap on one likely to be a title
        // In a real app, you'd want specific accessibility identifiers for content cards
        if let contentTitle = app.staticTexts.element(boundBy: 1) {
            contentTitle.tap()
            
            // Then - Verify content detail view is shown
            sleep(1)
            
            // Check for detail view UI elements
            XCTAssertTrue(app.buttons["saveContentButton"].exists, "Should show save button in detail view")
        } else {
            XCTFail("Could not find any content to tap")
        }
    }
    
    // MARK: - Teardown
    
    /// Teardown after each test
    override func tearDown() {
        app = nil
        super.tearDown()
    }
}