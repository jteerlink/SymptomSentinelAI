import XCTest
import SwiftUI
@testable import SymptomSentryAI

class ThemeManagerTests: XCTestCase {
    
    // MARK: - Properties
    
    var themeManager: ThemeManager!
    
    // MARK: - Setup & Teardown
    
    override func setUp() {
        super.setUp()
        // Reset UserDefaults to a clean state for each test
        let testDefaults = UserDefaults(suiteName: #file)!
        testDefaults.removePersistentDomain(forName: #file)
        
        // Create a new instance of ThemeManager for testing
        themeManager = ThemeManager.shared
    }
    
    override func tearDown() {
        themeManager = nil
        super.tearDown()
    }
    
    // MARK: - Tests
    
    func testDefaultThemeIsSystem() {
        // Remove any existing theme preferences
        UserDefaults.standard.removeObject(forKey: "app_theme_preference")
        
        // Create a new instance to test default behavior
        let manager = ThemeManager.shared
        
        // Default theme should be system
        XCTAssertEqual(manager.currentTheme, .system)
    }
    
    func testThemePersistence() {
        // Set the theme to dark
        themeManager.setTheme(.dark)
        
        // Check UserDefaults has saved the value
        let savedValue = UserDefaults.standard.string(forKey: "app_theme_preference")
        XCTAssertEqual(savedValue, "dark")
        
        // Create a new instance to check if it loads the saved preference
        let newManager = ThemeManager.shared
        XCTAssertEqual(newManager.currentTheme, .dark)
    }
    
    func testEffectiveColorScheme() {
        // Light theme should return light ColorScheme
        themeManager.setTheme(.light)
        XCTAssertEqual(themeManager.effectiveColorScheme(), .light)
        
        // Dark theme should return dark ColorScheme
        themeManager.setTheme(.dark)
        XCTAssertEqual(themeManager.effectiveColorScheme(), .dark)
        
        // System theme should return nil (let system decide)
        themeManager.setTheme(.system)
        XCTAssertNil(themeManager.effectiveColorScheme())
    }
    
    func testThemeDisplayName() {
        XCTAssertEqual(AppTheme.system.displayName, "System")
        XCTAssertEqual(AppTheme.light.displayName, "Light")
        XCTAssertEqual(AppTheme.dark.displayName, "Dark")
    }
    
    func testThemeIconName() {
        XCTAssertEqual(AppTheme.system.iconName, "gear")
        XCTAssertEqual(AppTheme.light.iconName, "sun.max.fill")
        XCTAssertEqual(AppTheme.dark.iconName, "moon.fill")
    }
}