import SwiftUI

@main
struct SymptomSentryAIApp: App {
    // MARK: - App Lifecycle
    
    /// Init: Setup app when it's first loaded
    init() {
        // Process command line arguments for UI testing
        processUITestingArguments()
        
        // Configure appearance
        configureAppearance()
    }
    
    // MARK: - Scene Setup
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear {
                    // Perform any additional setup when the root view appears
                }
        }
    }
    
    // MARK: - UI Testing Support
    
    /// Process command line arguments for UI Testing
    private func processUITestingArguments() {
        let arguments = CommandLine.arguments
        
        if arguments.contains("UI-TESTING") {
            // Ensure deterministic behavior for UI tests
            if arguments.contains("RESET-ONBOARDING") {
                // Reset onboarding state for testing
                UserDefaults.standard.set(false, forKey: "hasCompletedOnboarding")
            }
            
            if arguments.contains("ENABLE-FEATURE-TUTORIALS") {
                // Enable feature tutorials for testing
                UserDefaults.standard.set(false, forKey: "hasSeenFeatureTutorials")
            }
            
            // Reset all tutorial seen flags
            if arguments.contains("RESET-ALL-TUTORIALS") {
                let defaults = UserDefaults.standard
                defaults.set(false, forKey: "hasCompletedOnboarding")
                defaults.set(false, forKey: "hasSeenFeatureTutorials")
                defaults.set(false, forKey: "hasSeenAnalysisTutorial")
                defaults.set(false, forKey: "hasSeenImageUploadTutorial")
                defaults.set(false, forKey: "hasSeenTelemedicineTutorial")
            }
        }
    }
    
    // MARK: - Appearance Configuration
    
    /// Configure global app appearance
    private func configureAppearance() {
        // Configure navigation bar appearance
        let navBarAppearance = UINavigationBarAppearance()
        navBarAppearance.configureWithOpaqueBackground()
        navBarAppearance.backgroundColor = UIColor.systemBackground
        navBarAppearance.titleTextAttributes = [.foregroundColor: UIColor.label]
        navBarAppearance.largeTitleTextAttributes = [.foregroundColor: UIColor.label]
        
        UINavigationBar.appearance().standardAppearance = navBarAppearance
        UINavigationBar.appearance().compactAppearance = navBarAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navBarAppearance
        
        // Configure tab bar appearance
        let tabBarAppearance = UITabBarAppearance()
        tabBarAppearance.configureWithOpaqueBackground()
        tabBarAppearance.backgroundColor = UIColor.systemBackground
        
        UITabBar.appearance().standardAppearance = tabBarAppearance
        if #available(iOS 15.0, *) {
            UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
        }
    }
}