import SwiftUI
import Combine

/// Theme options for the app
enum AppTheme: String, CaseIterable {
    case system
    case light
    case dark
    
    var displayName: String {
        switch self {
        case .system: return "System"
        case .light: return "Light"
        case .dark: return "Dark"
        }
    }
    
    var iconName: String {
        switch self {
        case .system: return "gear"
        case .light: return "sun.max.fill"
        case .dark: return "moon.fill"
        }
    }
}

/// Theme manager for the app
class ThemeManager: ObservableObject {
    // Singleton instance
    static let shared = ThemeManager()
    
    // Published current theme preference
    @Published var currentTheme: AppTheme
    
    // User defaults key
    private let themeKey = "app_theme_preference"
    
    // Private initializer for singleton
    private init() {
        // Load saved preference from UserDefaults or default to system
        if let savedThemeRaw = UserDefaults.standard.string(forKey: themeKey),
           let savedTheme = AppTheme(rawValue: savedThemeRaw) {
            currentTheme = savedTheme
        } else {
            currentTheme = .system
        }
    }
    
    /// Set the app theme
    func setTheme(_ theme: AppTheme) {
        currentTheme = theme
        UserDefaults.standard.set(theme.rawValue, forKey: themeKey)
    }
    
    /// Get the effective theme (actual theme to apply considering system settings)
    func effectiveColorScheme() -> ColorScheme? {
        switch currentTheme {
        case .light:
            return .light
        case .dark:
            return .dark
        case .system:
            return nil // Let system decide
        }
    }
}

/// View modifier to apply the global theme
struct ThemeModifier: ViewModifier {
    @ObservedObject private var themeManager = ThemeManager.shared
    
    func body(content: Content) -> some View {
        content
            .preferredColorScheme(themeManager.effectiveColorScheme())
    }
}

/// Extension to make the theme modifier easier to apply
extension View {
    func withAppTheme() -> some View {
        self.modifier(ThemeModifier())
    }
}