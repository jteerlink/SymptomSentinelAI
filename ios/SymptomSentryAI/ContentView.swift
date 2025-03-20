import SwiftUI

struct ContentView: View {
    // MARK: - Environment & State
    
    /// Tutorial service to manage onboarding state
    @ObservedObject private var tutorialService = TutorialService.shared
    
    /// Currently selected tab
    @State private var selectedTab = 0
    
    // MARK: - Body
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Home
            NavigationView {
                Text("Home Screen")
                    .navigationTitle("Home")
            }
            .tabItem {
                Label("Home", systemImage: "house.fill")
            }
            .tag(0)
            
            // Analysis
            NavigationView {
                ImageUploadView()
                    .navigationTitle("Analysis")
            }
            .tabItem {
                Label("Analysis", systemImage: "waveform.path.ecg")
            }
            .tag(1)
            
            // Education
            NavigationView {
                EducationView()
                    .navigationTitle("Education")
            }
            .tabItem {
                Label("Education", systemImage: "book.fill")
            }
            .tag(2)
            
            // Profile
            NavigationView {
                ProfileView()
                    .navigationTitle("Profile")
            }
            .tabItem {
                Label("Profile", systemImage: "person.fill")
            }
            .tag(3)
        }
        .fullScreenCover(isPresented: $tutorialService.shouldShowOnboarding) {
            OnboardingView()
        }
        .overlay(
            // Show tutorial overlay when tutorial is active
            Group {
                if tutorialService.isTutorialOverlayVisible {
                    TutorialOverlayView()
                }
            }
        )
        .onChange(of: selectedTab) { newTab in
            // Trigger appropriate feature tutorials when navigating to specific tabs
            if newTab == 1 && !UserDefaults.standard.bool(forKey: "hasSeenAnalysisTutorial") {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    tutorialService.startFeatureTutorial(featureId: "analysis")
                    UserDefaults.standard.set(true, forKey: "hasSeenAnalysisTutorial")
                }
            } else if newTab == 2 && !UserDefaults.standard.bool(forKey: "hasSeenEducationTutorial") {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    tutorialService.startFeatureTutorial(featureId: "education")
                    UserDefaults.standard.set(true, forKey: "hasSeenEducationTutorial")
                }
            }
        }
    }
}

/// Profile view with settings to access tutorials
struct ProfileView: View {
    // MARK: - Environment & State
    
    /// Tutorial service
    @ObservedObject private var tutorialService = TutorialService.shared
    
    // MARK: - Body
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // User profile section
                ProfileHeaderView()
                
                // Settings sections
                SettingsSection(title: "App Settings") {
                    SettingsRowView(title: "Notifications", icon: "bell.fill") {
                        // Action
                    }
                    
                    SettingsRowView(title: "Privacy", icon: "lock.fill") {
                        // Action
                    }
                    
                    SettingsRowView(title: "Language", icon: "globe") {
                        // Action
                    }
                }
                
                SettingsSection(title: "Help & Support") {
                    SettingsRowView(title: "Tutorials", icon: "questionmark.circle.fill") {
                        showTutorialsMenu()
                    }
                    
                    SettingsRowView(title: "Contact Support", icon: "envelope.fill") {
                        // Action
                    }
                    
                    SettingsRowView(title: "FAQ", icon: "text.book.closed.fill") {
                        // Action
                    }
                }
                
                SettingsSection(title: "Account") {
                    SettingsRowView(title: "Subscription", icon: "star.fill") {
                        // Action
                    }
                    
                    SettingsRowView(title: "Privacy Settings", icon: "hand.raised.fill") {
                        // Action
                    }
                    
                    SettingsRowView(title: "Sign Out", icon: "arrow.right.square.fill", foregroundColor: .red) {
                        // Action
                    }
                }
            }
            .padding()
        }
        .sheet(isPresented: $showingTutorialsMenu) {
            TutorialsMenuView()
        }
    }
    
    // MARK: - State
    
    @State private var showingTutorialsMenu = false
    
    // MARK: - Methods
    
    private func showTutorialsMenu() {
        showingTutorialsMenu = true
    }
}

/// Menu with tutorial options
struct TutorialsMenuView: View {
    // MARK: - Environment & State
    
    /// Tutorial service
    @ObservedObject private var tutorialService = TutorialService.shared
    
    /// Dismissal handling
    @Environment(\.dismiss) var dismiss
    
    // MARK: - Body
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("App Tutorials")) {
                    // Replay full onboarding
                    Button(action: {
                        dismiss()
                        // Brief delay before showing onboarding
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            tutorialService.startOnboarding()
                        }
                    }) {
                        HStack {
                            Image(systemName: "play.fill")
                                .frame(width: 30)
                                .foregroundColor(.blue)
                            
                            Text("Replay Onboarding")
                        }
                    }
                    
                    // Feature-specific tutorials
                    Button(action: {
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            tutorialService.startFeatureTutorial(featureId: "imageUpload")
                        }
                    }) {
                        HStack {
                            Image(systemName: "camera.fill")
                                .frame(width: 30)
                                .foregroundColor(.green)
                            
                            Text("Image Upload Guide")
                        }
                    }
                    
                    Button(action: {
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            tutorialService.startFeatureTutorial(featureId: "analysis")
                        }
                    }) {
                        HStack {
                            Image(systemName: "waveform.path.ecg")
                                .frame(width: 30)
                                .foregroundColor(.purple)
                            
                            Text("Analysis Features")
                        }
                    }
                    
                    Button(action: {
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            tutorialService.startFeatureTutorial(featureId: "education")
                        }
                    }) {
                        HStack {
                            Image(systemName: "book.fill")
                                .frame(width: 30)
                                .foregroundColor(.green)
                            
                            Text("Educational Content Guide")
                        }
                    }
                    
                    Button(action: {
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            tutorialService.startFeatureTutorial(featureId: "telemedicine")
                        }
                    }) {
                        HStack {
                            Image(systemName: "video.fill")
                                .frame(width: 30)
                                .foregroundColor(.red)
                            
                            Text("Telemedicine Guide")
                        }
                    }
                }
                
                Section(header: Text("Reset")) {
                    Button(action: {
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            tutorialService.resetTutorials()
                        }
                    }) {
                        HStack {
                            Image(systemName: "arrow.clockwise")
                                .frame(width: 30)
                                .foregroundColor(.orange)
                            
                            Text("Reset All Tutorials")
                        }
                    }
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("Tutorials")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

/// Profile header view
struct ProfileHeaderView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.circle.fill")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 100, height: 100)
                .foregroundColor(.blue)
            
            Text("John Doe")
                .font(.title)
                .fontWeight(.bold)
            
            Text("john.doe@example.com")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            HStack(spacing: 40) {
                VStack {
                    Text("5")
                        .font(.headline)
                    Text("Analyses")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                VStack {
                    Text("2")
                        .font(.headline)
                    Text("Consultations")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                VStack {
                    Text("Free")
                        .font(.headline)
                    Text("Plan")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        )
    }
}

/// Settings section view
struct SettingsSection<Content: View>: View {
    let title: String
    let content: Content
    
    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .foregroundColor(.secondary)
                .padding(.leading, 8)
            
            VStack(spacing: 0) {
                content
            }
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(.systemBackground))
                    .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 1)
            )
        }
    }
}

/// Settings row view
struct SettingsRowView: View {
    let title: String
    let icon: String
    let foregroundColor: Color
    let action: () -> Void
    
    init(title: String, icon: String, foregroundColor: Color = .primary, action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.foregroundColor = foregroundColor
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .frame(width: 24, height: 24)
                    .foregroundColor(foregroundColor)
                
                Text(title)
                    .foregroundColor(foregroundColor)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(Color(.systemGray3))
            }
            .padding(.vertical, 14)
            .padding(.horizontal, 16)
        }
        .accessibilityIdentifier(title.replacingOccurrences(of: " ", with: ""))
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}