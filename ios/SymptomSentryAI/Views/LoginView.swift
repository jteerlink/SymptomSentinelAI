import SwiftUI

struct LoginView: View {
    // MARK: - Properties
    
    /// Callback when login/registration completes
    var onComplete: (Bool) -> Void
    
    /// User authentication service
    @EnvironmentObject var userService: UserService
    
    /// UI state
    @State private var isRegistering = false
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var isLoading = false
    
    // MARK: - Body
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background
                Color(.systemBackground)
                    .edgesIgnoringSafeArea(.all)
                
                // Content
                VStack(spacing: 30) {
                    // Header
                    VStack(spacing: 15) {
                        Image(systemName: "lock.shield")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 60, height: 60)
                            .foregroundColor(.blue)
                            .padding()
                            .background(
                                Circle()
                                    .fill(Color.blue.opacity(0.1))
                            )
                        
                        Text(isRegistering ? "Create Account" : "Sign In")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text(isRegistering ? 
                            "Create a new account to save your analysis results" : 
                            "Sign in to your account to save your analysis results")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    
                    // Form
                    VStack(spacing: 20) {
                        if isRegistering {
                            // Name field
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Full Name")
                                    .font(.callout)
                                    .fontWeight(.semibold)
                                
                                TextField("Enter your name", text: $name)
                                    .padding()
                                    .background(Color(.systemGray6))
                                    .cornerRadius(10)
                                    .autocapitalization(.words)
                                    .disableAutocorrection(true)
                            }
                        }
                        
                        // Email field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email Address")
                                .font(.callout)
                                .fontWeight(.semibold)
                            
                            TextField("Enter your email", text: $email)
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(10)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                        }
                        
                        // Password field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Password")
                                .font(.callout)
                                .fontWeight(.semibold)
                            
                            SecureField("Enter your password", text: $password)
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(10)
                        }
                    }
                    .padding(.horizontal)
                    
                    // Submit button
                    Button(action: handleSubmit) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .cornerRadius(10)
                        } else {
                            Text(isRegistering ? "Create Account" : "Sign In")
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                    }
                    .disabled(isLoading)
                    .padding(.horizontal)
                    
                    // Switch between login/register
                    Button(action: {
                        withAnimation {
                            isRegistering.toggle()
                        }
                    }) {
                        Text(isRegistering ? "Already have an account? Sign In" : "Don't have an account? Create one")
                            .foregroundColor(.blue)
                    }
                    .padding(.top, 10)
                    
                    Spacer()
                }
                .padding(.top, 40)
            }
            .navigationBarTitle("", displayMode: .inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        onComplete(false)
                    }
                }
            }
            .alert(isPresented: $showingAlert) {
                Alert(
                    title: Text("Message"),
                    message: Text(alertMessage),
                    dismissButton: .default(Text("OK"))
                )
            }
        }
    }
    
    // MARK: - Methods
    
    /// Handle form submission (login or register)
    private func handleSubmit() {
        isLoading = true
        
        if isRegistering {
            guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                showAlert("Please enter your name")
                isLoading = false
                return
            }
            
            // Register
            userService.register(email: email, password: password, name: name) { success, errorMessage in
                isLoading = false
                
                if success {
                    onComplete(true)
                } else if let errorMessage = errorMessage {
                    showAlert(errorMessage)
                } else {
                    showAlert("Registration failed. Please try again.")
                }
            }
        } else {
            // Login
            userService.login(email: email, password: password) { success, errorMessage in
                isLoading = false
                
                if success {
                    onComplete(true)
                } else if let errorMessage = errorMessage {
                    showAlert(errorMessage)
                } else {
                    showAlert("Login failed. Please try again.")
                }
            }
        }
    }
    
    /// Show an alert with the given message
    private func showAlert(_ message: String) {
        alertMessage = message
        showingAlert = true
    }
}

// MARK: - Preview

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView(onComplete: { _ in })
            .environmentObject(UserService.shared)
    }
}