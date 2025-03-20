import SwiftUI

struct ContentView: View {
    @EnvironmentObject var userService: UserService
    @StateObject private var tutorialService = TutorialService.shared
    @State private var selectedTab = 0
    @State private var screenSize: CGSize = .zero
    
    var body: some View {
        GeometryReader { geometry in
            Group {
                if userService.isAuthenticated {
                    // Main app with tab navigation
                    ZStack {
                        TabView(selection: $selectedTab) {
                            HomeView()
                                .tabItem {
                                    Label("Home", systemImage: "house")
                                }
                                .tag(0)
                            
                            AnalysisView()
                                .tabItem {
                                    Label("Analysis", systemImage: "camera")
                                }
                                .tag(1)
                            
                            EducationView()
                                .tabItem {
                                    Label("Learn", systemImage: "book")
                                }
                                .tag(2)
                            
                            SubscriptionView()
                                .tabItem {
                                    Label("Premium", systemImage: "star")
                                }
                                .tag(3)
                            
                            ProfileView()
                                .tabItem {
                                    Label("Profile", systemImage: "person")
                                }
                                .tag(4)
                        }
                        .accentColor(Color.blue)
                        
                        // Show tutorial overlay if needed
                        if tutorialService.isShowingTutorial {
                            TutorialOverlayView(
                                selectedTab: $selectedTab,
                                screenSize: screenSize
                            )
                            .zIndex(100) // Ensure it's on top
                        }
                    }
                    .onAppear {
                        // Update screen size when view appears
                        screenSize = geometry.size
                        
                        // Check if tutorial should be shown
                        if !tutorialService.tutorialCompleted {
                            tutorialService.startTutorial()
                        }
                    }
                    .onChange(of: geometry.size) { newSize in
                        screenSize = newSize
                    }
                } else {
                    // Authentication flow
                    AuthView()
                }
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
        }
    }
}

// Authentication View
struct AuthView: View {
    @State private var isLogin = true
    @EnvironmentObject var userService: UserService
    
    // Login form fields
    @State private var loginEmail = ""
    @State private var loginPassword = ""
    
    // Registration form fields
    @State private var registerName = ""
    @State private var registerEmail = ""
    @State private var registerPassword = ""
    @State private var registerConfirmPassword = ""
    
    var body: some View {
        NavigationView {
            VStack {
                // App logo
                Image(systemName: "stethoscope")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 100, height: 100)
                    .foregroundColor(.blue)
                    .padding(.top, 50)
                
                Text("SymptomSentry AI")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.bottom, 30)
                
                // Toggle between login and register
                Picker("Authentication Mode", selection: $isLogin) {
                    Text("Login").tag(true)
                    Text("Register").tag(false)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal, 40)
                .padding(.bottom, 20)
                
                if isLogin {
                    // Login Form
                    VStack(spacing: 20) {
                        TextField("Email", text: $loginEmail)
                            .autocapitalization(.none)
                            .keyboardType(.emailAddress)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .padding(.horizontal, 40)
                        
                        SecureField("Password", text: $loginPassword)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .padding(.horizontal, 40)
                        
                        Button(action: handleLogin) {
                            Text("Log In")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding()
                                .frame(minWidth: 0, maxWidth: .infinity)
                                .background(Color.blue)
                                .cornerRadius(10)
                        }
                        .padding(.horizontal, 40)
                        .disabled(userService.isLoading)
                        
                        if userService.isLoading {
                            ProgressView()
                        }
                        
                        if let error = userService.error {
                            Text(error)
                                .foregroundColor(.red)
                                .padding(.top, 10)
                        }
                    }
                } else {
                    // Register Form
                    ScrollView {
                        VStack(spacing: 20) {
                            TextField("Full Name", text: $registerName)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .padding(.horizontal, 40)
                            
                            TextField("Email", text: $registerEmail)
                                .autocapitalization(.none)
                                .keyboardType(.emailAddress)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .padding(.horizontal, 40)
                            
                            SecureField("Password", text: $registerPassword)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .padding(.horizontal, 40)
                            
                            SecureField("Confirm Password", text: $registerConfirmPassword)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .padding(.horizontal, 40)
                            
                            Button(action: handleRegistration) {
                                Text("Create Account")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .padding()
                                    .frame(minWidth: 0, maxWidth: .infinity)
                                    .background(Color.blue)
                                    .cornerRadius(10)
                            }
                            .padding(.horizontal, 40)
                            .disabled(userService.isLoading || registerPassword != registerConfirmPassword)
                            
                            if userService.isLoading {
                                ProgressView()
                            }
                            
                            if let error = userService.error {
                                Text(error)
                                    .foregroundColor(.red)
                                    .padding(.top, 10)
                            }
                            
                            if registerPassword != registerConfirmPassword && !registerConfirmPassword.isEmpty {
                                Text("Passwords do not match")
                                    .foregroundColor(.red)
                                    .padding(.top, 10)
                            }
                        }
                        .padding(.vertical)
                    }
                }
                
                Spacer()
            }
            .navigationBarHidden(true)
        }
    }
    
    private func handleLogin() {
        userService.signIn(email: loginEmail, password: loginPassword) { success, error in
            if !success, let error = error {
                userService.error = error
            }
        }
    }
    
    private func handleRegistration() {
        guard registerPassword == registerConfirmPassword else {
            userService.error = "Passwords do not match"
            return
        }
        
        userService.signUp(name: registerName, email: registerEmail, password: registerPassword) { success, error in
            if !success, let error = error {
                userService.error = error
            }
        }
    }
}

// Preview provider
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(UserService.shared)
    }
}