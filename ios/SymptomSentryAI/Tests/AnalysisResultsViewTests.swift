import XCTest
import SwiftUI
@testable import SymptomSentryAI

class AnalysisResultsViewTests: XCTestCase {
    
    // MARK: - Properties
    
    var app: XCUIApplication!
    
    // MARK: - Setup & Teardown
    
    override func setUp() {
        super.setUp()
        
        // Initialize the app for UI testing
        app = XCUIApplication()
        app.launchArguments = ["UI-TESTING"]
        app.launch()
        
        // Ensure we're in a known state
        navigateToAnalysisResults()
    }
    
    override func tearDown() {
        app = nil
        super.tearDown()
    }
    
    // MARK: - Helper Methods
    
    func navigateToAnalysisResults() {
        // This assumes we have a way to navigate directly to the analysis results screen
        // with test data during UI testing mode
        
        // Navigate to the home screen first
        app.tabBars.buttons["Home"].tap()
        
        // Tap on the "Analysis" section
        app.buttons["StartAnalysisButton"].tap()
        
        // Wait for the image upload view to appear and upload a test image
        let uploadButton = app.buttons["SelectImageButton"]
        XCTAssertTrue(uploadButton.waitForExistence(timeout: 5.0))
        uploadButton.tap()
        
        // Select the camera roll option
        app.sheets.buttons["Camera Roll"].tap()
        
        // Select the first image
        let firstImage = app.images.firstMatch
        XCTAssertTrue(firstImage.waitForExistence(timeout: 5.0))
        firstImage.tap()
        
        // Tap the analyze button
        let analyzeButton = app.buttons["AnalyzeImageButton"]
        XCTAssertTrue(analyzeButton.waitForExistence(timeout: 5.0))
        analyzeButton.tap()
        
        // Wait for analysis to complete and results view to appear
        let resultsTitle = app.staticTexts["Analysis Complete"]
        XCTAssertTrue(resultsTitle.waitForExistence(timeout: 10.0))
    }
    
    // MARK: - Tests
    
    func testImageIsDisplayed() {
        // Test that the analyzed image is displayed
        let imageView = app.images["AnalyzedImageView"]
        XCTAssertTrue(imageView.exists)
        XCTAssertTrue(imageView.isHittable)
    }
    
    func testAnalysisHeaderInformation() {
        // Test header information is displayed
        XCTAssertTrue(app.staticTexts["Analysis Complete"].exists)
        
        // Test type information is displayed
        let typeText = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Type:")).firstMatch
        XCTAssertTrue(typeText.exists)
        
        // Test date information is displayed
        let dateText = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Completed on")).firstMatch
        XCTAssertTrue(dateText.exists)
    }
    
    func testConditionsListDisplay() {
        // Test that the conditions list header is displayed
        XCTAssertTrue(app.staticTexts["Potential Conditions"].exists)
        
        // Test that at least one condition is displayed (assumes test data has conditions)
        let conditionCells = app.buttons.matching(identifier: "ConditionCell")
        XCTAssertTrue(conditionCells.count > 0, "No condition cells found")
        
        // Check first condition has required elements
        let firstCondition = conditionCells.firstMatch
        XCTAssertTrue(firstCondition.exists)
        
        // Check the condition name exists
        let conditionName = firstCondition.staticTexts.firstMatch
        XCTAssertTrue(conditionName.exists)
        
        // Check the confidence percentage
        let confidenceText = firstCondition.staticTexts.matching(NSPredicate(format: "label ENDSWITH %@", "%")).firstMatch
        XCTAssertTrue(confidenceText.exists)
    }
    
    func testConditionDetailNavigation() {
        // Tap on the first condition to view details
        let conditionCells = app.buttons.matching(identifier: "ConditionCell")
        let firstCondition = conditionCells.firstMatch
        XCTAssertTrue(firstCondition.exists)
        firstCondition.tap()
        
        // Verify detail view appears
        let detailViewTitle = app.navigationBars.staticTexts.firstMatch
        XCTAssertTrue(detailViewTitle.waitForExistence(timeout: 2.0))
        
        // Verify common elements in detail view
        XCTAssertTrue(app.staticTexts["About this Condition"].exists)
        XCTAssertTrue(app.staticTexts["Common Symptoms"].exists)
        
        // Check for action buttons
        XCTAssertTrue(app.buttons["Learn More"].exists)
        XCTAssertTrue(app.buttons["Consult a Doctor"].exists)
        
        // Dismiss the detail view
        app.buttons["Close"].tap()
        
        // Verify we're back to results view
        XCTAssertTrue(app.staticTexts["Analysis Complete"].waitForExistence(timeout: 2.0))
    }
    
    func testActionButtons() {
        // Verify both action buttons exist
        XCTAssertTrue(app.buttons["Learn About This Condition"].exists)
        XCTAssertTrue(app.buttons["Connect With Doctor"].exists)
        
        // Test the learn more button
        app.buttons["Learn About This Condition"].tap()
        
        // Depending on implementation, verify the expected navigation occurred
        // This is just a placeholder as the actual behavior would depend on the implementation
        
        // Navigate back if needed
        if app.navigationBars.buttons["Back"].exists {
            app.navigationBars.buttons["Back"].tap()
        }
        
        // Test the connect with doctor button
        XCTAssertTrue(app.buttons["Connect With Doctor"].waitForExistence(timeout: 2.0))
        app.buttons["Connect With Doctor"].tap()
        
        // Again, verify expected result based on implementation
    }
    
    func testShareFunctionality() {
        // Test the share button in navigation bar
        let shareButton = app.navigationBars.buttons["Share"]
        XCTAssertTrue(shareButton.exists)
        shareButton.tap()
        
        // Verify share sheet appears
        let shareSheet = app.sheets.firstMatch
        XCTAssertTrue(shareSheet.waitForExistence(timeout: 2.0))
        
        // Dismiss the share sheet
        shareSheet.buttons["Cancel"].tap()
    }
    
    func testAccessibilitySupport() {
        // Test that major elements have proper accessibility identifiers
        XCTAssertTrue(app.images["AnalyzedImageView"].exists)
        
        // Test that interactive elements are accessible
        let conditionCells = app.buttons.matching(identifier: "ConditionCell")
        let firstCondition = conditionCells.firstMatch
        XCTAssertTrue(firstCondition.isEnabled)
        XCTAssertTrue(app.buttons["Learn About This Condition"].isEnabled)
        XCTAssertTrue(app.buttons["Connect With Doctor"].isEnabled)
    }
}

// MARK: - Unit Tests for AnalysisResultsView

class AnalysisResultsViewUnitTests: XCTestCase {
    
    func testAnalysisResponseFormattedDate() {
        // Test the formattedDate computed property
        let timestamp = "2025-03-20T15:35:42.123456"
        let response = AnalysisResponse(
            id: "test-id",
            type: "throat",
            timestamp: timestamp,
            conditions: []
        )
        
        // The actual format depends on the user's locale, so we just check it's not the raw timestamp
        XCTAssertNotEqual(response.formattedDate, timestamp)
    }
    
    func testConfidencePercentageFormatting() {
        // Test confidence percentage formatting
        let condition = AnalysisCondition(
            id: "test", 
            name: "Test Condition", 
            description: "Description", 
            confidence: 0.756, 
            symptoms: ["Symptom 1"], 
            isPotentiallySerious: false
        )
        
        // Format should be "75.6%" or similar depending on locale
        XCTAssertTrue(condition.confidencePercentage.contains("75"))
        XCTAssertTrue(condition.confidencePercentage.contains("%"))
    }
    
    func testConfidenceBadgeColors() {
        // Test confidence badge color logic
        
        // High confidence - red
        var condition = AnalysisCondition(
            id: "test", 
            name: "Test", 
            description: "Description", 
            confidence: 0.8, 
            symptoms: [], 
            isPotentiallySerious: false
        )
        XCTAssertEqual(condition.confidenceBadgeColor, "red")
        
        // Medium confidence - yellow
        condition = AnalysisCondition(
            id: "test", 
            name: "Test", 
            description: "Description", 
            confidence: 0.5, 
            symptoms: [], 
            isPotentiallySerious: false
        )
        XCTAssertEqual(condition.confidenceBadgeColor, "yellow")
        
        // Low confidence - green
        condition = AnalysisCondition(
            id: "test", 
            name: "Test", 
            description: "Description", 
            confidence: 0.3, 
            symptoms: [], 
            isPotentiallySerious: false
        )
        XCTAssertEqual(condition.confidenceBadgeColor, "green")
    }
    
    func testIsHighConfidence() {
        // Test high confidence flag
        
        // High confidence
        var condition = AnalysisCondition(
            id: "test", 
            name: "Test", 
            description: "Description", 
            confidence: 0.7, 
            symptoms: [], 
            isPotentiallySerious: false
        )
        XCTAssertTrue(condition.isHighConfidence)
        
        // Low confidence
        condition = AnalysisCondition(
            id: "test", 
            name: "Test", 
            description: "Description", 
            confidence: 0.5, 
            symptoms: [], 
            isPotentiallySerious: false
        )
        XCTAssertFalse(condition.isHighConfidence)
    }
}