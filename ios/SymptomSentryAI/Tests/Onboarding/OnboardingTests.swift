import XCTest
@testable import SymptomSentryAI

class OnboardingTests: XCTestCase {
    
    // MARK: - Properties
    
    var app: XCUIApplication!
    
    // MARK: - Setup & Teardown
    
    override func setUp() {
        super.setUp()
        
        // Initialize the app for UI testing with onboarding always enabled
        app = XCUIApplication()
        app.launchArguments = ["UI-TESTING", "RESET-ONBOARDING"]
        app.launch()
    }
    
    override func tearDown() {
        app = nil
        super.tearDown()
    }
    
    // MARK: - Tests
    
    /// Test the complete onboarding flow by navigating through all slides
    func testOnboardingNavigation() {
        // Verify we're on the first onboarding screen
        XCTAssertTrue(app.staticTexts["Welcome to SymptomSentryAI"].waitForExistence(timeout: 5))
        
        // Verify the skip button exists
        XCTAssertTrue(app.buttons["SkipButton"].exists)
        
        // Navigate through all slides using the "Next" button
        for _ in 0..<5 {
            // Tap the "Next" button
            let nextButton = app.buttons["NextButton"]
            XCTAssertTrue(nextButton.waitForExistence(timeout: 2))
            nextButton.tap()
            
            // Wait for animations
            sleep(1)
        }
        
        // On the last slide, verify the "Get Started" button exists
        XCTAssertTrue(app.buttons["GetStartedButton"].waitForExistence(timeout: 2))
        
        // Tap "Get Started" to complete onboarding
        app.buttons["GetStartedButton"].tap()
        
        // Verify we're now on the main app screen (e.g., Home screen)
        XCTAssertTrue(app.navigationBars.staticTexts["Home"].waitForExistence(timeout: 5))
    }
    
    /// Test skipping the onboarding flow
    func testSkippingOnboarding() {
        // Verify we're on the onboarding screen
        XCTAssertTrue(app.staticTexts["Welcome to SymptomSentryAI"].waitForExistence(timeout: 5))
        
        // Tap the "Skip" button
        let skipButton = app.buttons["SkipButton"]
        XCTAssertTrue(skipButton.waitForExistence(timeout: 2))
        skipButton.tap()
        
        // Verify we're now on the main app screen
        XCTAssertTrue(app.navigationBars.staticTexts["Home"].waitForExistence(timeout: 5))
    }
    
    /// Test navigation between slides using swipe gestures
    func testSwipeNavigation() {
        // Verify we're on the first onboarding screen
        XCTAssertTrue(app.staticTexts["Welcome to SymptomSentryAI"].waitForExistence(timeout: 5))
        
        // Get screen dimensions for swipe gestures
        let screenWidth = app.windows.element(boundBy: 0).frame.width
        let screenHeight = app.windows.element(boundBy: 0).frame.height
        let startX = screenWidth * 0.9
        let endX = screenWidth * 0.1
        let midY = screenHeight * 0.5
        
        // Swipe left to navigate to the second slide
        app.coordinate(withNormalizedOffset: CGVector(dx: startX / screenWidth, dy: midY / screenHeight))
            .swipe(to: app.coordinate(withNormalizedOffset: CGVector(dx: endX / screenWidth, dy: midY / screenHeight)))
        
        // Verify we're on the second slide
        XCTAssertTrue(app.staticTexts["Capture & Analyze"].waitForExistence(timeout: 5))
        
        // Swipe right to go back to the first slide
        app.coordinate(withNormalizedOffset: CGVector(dx: endX / screenWidth, dy: midY / screenHeight))
            .swipe(to: app.coordinate(withNormalizedOffset: CGVector(dx: startX / screenWidth, dy: midY / screenHeight)))
        
        // Verify we're back on the first slide
        XCTAssertTrue(app.staticTexts["Welcome to SymptomSentryAI"].waitForExistence(timeout: 5))
    }
    
    /// Test the back button functionality
    func testBackButton() {
        // Verify we're on the first onboarding screen
        XCTAssertTrue(app.staticTexts["Welcome to SymptomSentryAI"].waitForExistence(timeout: 5))
        
        // Navigate to the second slide
        app.buttons["NextButton"].tap()
        XCTAssertTrue(app.staticTexts["Capture & Analyze"].waitForExistence(timeout: 5))
        
        // Verify the back button is now visible (it's hidden on the first screen)
        let backButton = app.buttons["PreviousButton"]
        XCTAssertTrue(backButton.waitForExistence(timeout: 2))
        
        // Navigate back to the first slide
        backButton.tap()
        
        // Verify we're back on the first slide
        XCTAssertTrue(app.staticTexts["Welcome to SymptomSentryAI"].waitForExistence(timeout: 5))
        
        // Verify the back button is hidden on the first slide
        XCTAssertFalse(backButton.isVisible)
    }
    
    /// Test interactive components in the onboarding flow
    func testInteractiveComponents() {
        // Verify we're on the first onboarding screen
        XCTAssertTrue(app.staticTexts["Welcome to SymptomSentryAI"].waitForExistence(timeout: 5))
        
        // Navigate to the slide with image upload demo
        app.buttons["NextButton"].tap()
        XCTAssertTrue(app.staticTexts["Capture & Analyze"].waitForExistence(timeout: 5))
        
        // Interact with the upload demo component if it exists
        if app.staticTexts["Tap to simulate photo capture"].exists {
            // Find the interactive area and tap it
            let uploadDemoArea = app.otherElements.matching(NSPredicate(format: "label CONTAINS %@", "simulate photo capture")).firstMatch
            uploadDemoArea.tap()
            
            // Verify the state changed (this would depend on the specific implementation)
            sleep(1) // Wait for animation
        }
        
        // Navigate to subscription demo slide (usually the last or second-to-last)
        for _ in 0..<4 {
            app.buttons["NextButton"].tap()
            sleep(1)
        }
        
        // Interact with the subscription demo if it exists
        if app.buttons["Try Premium"].exists {
            app.buttons["Try Premium"].tap()
            
            // Verify the button state changed
            XCTAssertTrue(app.buttons["Subscribed!"].waitForExistence(timeout: 2))
        }
    }
}

class FeatureTutorialTests: XCTestCase {
    
    // MARK: - Properties
    
    var app: XCUIApplication!
    
    // MARK: - Setup & Teardown
    
    override func setUp() {
        super.setUp()
        
        // Initialize the app for UI testing with feature tutorials enabled
        app = XCUIApplication()
        app.launchArguments = ["UI-TESTING", "ENABLE-FEATURE-TUTORIALS"]
        app.launch()
    }
    
    override func tearDown() {
        app = nil
        super.tearDown()
    }
    
    // MARK: - Tests
    
    /// Test the feature tutorial overlay for image upload
    func testImageUploadTutorial() {
        // Navigate to the image upload screen
        app.tabBars.buttons["Analysis"].tap()
        
        // Verify the feature tutorial appears
        XCTAssertTrue(app.otherElements["FeatureTutorial-imageUpload"].waitForExistence(timeout: 5))
        
        // Navigate through tutorial steps
        app.buttons["NextTutorialStepButton"].tap()
        sleep(1)
        
        // Verify we can complete the tutorial
        app.buttons["NextTutorialStepButton"].tap()
        
        // Verify the tutorial is dismissed
        XCTAssertFalse(app.otherElements["FeatureTutorial-imageUpload"].exists)
    }
    
    /// Test skipping a feature tutorial
    func testSkippingFeatureTutorial() {
        // Navigate to a screen with a feature tutorial
        app.tabBars.buttons["Education"].tap()
        
        // Verify the feature tutorial appears
        XCTAssertTrue(app.otherElements.matching(NSPredicate(format: "identifier BEGINSWITH %@", "FeatureTutorial-")).firstMatch.waitForExistence(timeout: 5))
        
        // Skip the tutorial
        app.buttons["SkipTutorialButton"].tap()
        
        // Verify the tutorial is dismissed
        XCTAssertFalse(app.otherElements.matching(NSPredicate(format: "identifier BEGINSWITH %@", "FeatureTutorial-")).firstMatch.exists)
    }
    
    /// Test accessing tutorials from settings
    func testAccessingTutorialsFromSettings() {
        // Navigate to settings
        app.tabBars.buttons["Profile"].tap()
        
        // Tap on the "Tutorials" option
        app.scrollViews.otherElements.buttons["Tutorials"].tap()
        
        // Verify the tutorials screen appears
        XCTAssertTrue(app.navigationBars.staticTexts["Tutorials"].waitForExistence(timeout: 5))
        
        // Tap on "Replay Onboarding"
        app.scrollViews.otherElements.buttons["Replay Onboarding"].tap()
        
        // Verify onboarding appears
        XCTAssertTrue(app.staticTexts["Welcome to SymptomSentryAI"].waitForExistence(timeout: 5))
    }
}

extension XCUIElement {
    /// Determine if an element is visible on screen
    var isVisible: Bool {
        guard exists && !frame.isEmpty else { return false }
        return XCUIApplication().windows.element(boundBy: 0).frame.contains(frame)
    }
}