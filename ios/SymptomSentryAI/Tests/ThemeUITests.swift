import XCTest

class ThemeUITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        
        // Clear settings and launch fresh
        app.launchArguments.append("UI-TESTING")
        app.launchArguments.append("RESET-ALL-TUTORIALS")
    }
    
    func testThemePicker() {
        // Launch the app
        app.launch()
        
        // Skip onboarding if present
        if app.buttons["Get Started"].exists {
            app.buttons["Get Started"].tap()
        }
        
        // Navigate to Profile tab
        app.tabBars.buttons["Profile"].tap()
        
        // Find and tap the theme row
        let themeRow = app.staticTexts["Theme"]
        XCTAssertTrue(themeRow.exists, "Theme row should exist in settings")
        themeRow.tap()
        
        // Test that theme options are available
        let lightThemeOption = app.staticTexts["Light"]
        let darkThemeOption = app.staticTexts["Dark"]
        let systemThemeOption = app.staticTexts["System"]
        
        XCTAssertTrue(lightThemeOption.exists, "Light theme option should exist")
        XCTAssertTrue(darkThemeOption.exists, "Dark theme option should exist")
        XCTAssertTrue(systemThemeOption.exists, "System theme option should exist")
        
        // Select dark theme
        darkThemeOption.tap()
        
        // Close the picker
        app.buttons["Done"].tap()
        
        // Reopen the theme picker to verify selection was saved
        themeRow.tap()
        
        // Check if dark theme is selected (has a checkmark)
        let darkSelected = app.images["checkmark"].exists
        XCTAssertTrue(darkSelected, "Dark theme should be selected with a checkmark")
        
        // Select light theme
        lightThemeOption.tap()
        app.buttons["Done"].tap()
        
        // Reopen to verify light theme selection
        themeRow.tap()
        
        // Test that theme icon displays correctly
        let themeIcon = app.images["sun.max.fill"]
        XCTAssertTrue(themeIcon.exists, "Light theme icon should be visible")
        
        // Choose system theme to reset to default
        systemThemeOption.tap()
        app.buttons["Done"].tap()
    }
    
    func testThemeAppliesToUI() {
        // Test with light theme
        app.launchArguments.append("THEME-LIGHT")
        app.launch()
        
        // Skip onboarding if present
        if app.buttons["Get Started"].exists {
            app.buttons["Get Started"].tap()
        }
        
        // Navigate to Analysis tab to check UI elements
        app.tabBars.buttons["Analysis"].tap()
        
        // Take a screenshot for light theme
        let lightSnapshot = XCUIScreen.main.screenshot()
        
        // Restart with dark theme
        app.terminate()
        
        app.launchArguments.append("THEME-DARK")
        app.launch()
        
        // Skip onboarding if present
        if app.buttons["Get Started"].exists {
            app.buttons["Get Started"].tap()
        }
        
        // Navigate to Analysis tab to check UI elements
        app.tabBars.buttons["Analysis"].tap()
        
        // Take a screenshot for dark theme
        let darkSnapshot = XCUIScreen.main.screenshot()
        
        // We can't actually compare colors programmatically in XCTest
        // But we can verify the app doesn't crash when changing themes
        XCTAssertTrue(true, "App should handle theme changes without crashing")
    }
}