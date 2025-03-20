import SwiftUI

@main
struct SymptomSentryAIApp: App {
    // Create UserService as a StateObject to share across the app
    @StateObject private var userService = UserService.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(userService)
        }
    }
}