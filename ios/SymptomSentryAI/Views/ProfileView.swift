import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var userService: UserService
    
    // Form state
    @State private var name: String = ""
    @State private var email: String = ""
    @State private var phoneNumber: String = ""
    @State private var notificationsEnabled: Bool = true
    @State private var darkModeEnabled: Bool = false
    @State private var dataUsageConsent: Bool = true
    
    // UI state
    @State private var isEditing: Bool = false
    @State private var showingLogoutConfirmation = false
    @State private var showingDeleteAccountConfirmation = false
    @State private var isSaving: Bool = false
    @State private var showSuccessMessage: Bool = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Profile header
                    profileHeaderView
                        .padding()
                    
                    // Account info section
                    sectionView(title: "Account Information", content: accountInfoView)
                    
                    // Preferences section
                    sectionView(title: "Preferences", content: preferencesView)
                    
                    // Support section
                    sectionView(title: "Support", content: supportView)
                    
                    // Account actions section
                    sectionView(title: "Account Actions", content: accountActionsView)
                    
                    // App version
                    Text("SymptomSentryAI v1.0.0")
                        .font(.caption)
                        .foregroundColor(.gray)
                        .padding(.top, 20)
                        .padding(.bottom, 10)
                }
                .padding(.vertical)
            }
            .navigationTitle("Profile")
            .toolbar {
                if isEditing {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button(action: saveProfile) {
                            if isSaving {
                                ProgressView()
                            } else {
                                Text("Save")
                                    .fontWeight(.semibold)
                            }
                        }
                        .disabled(isSaving)
                    }
                    
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") {
                            isEditing = false
                            loadUserData()
                        }
                        .disabled(isSaving)
                    }
                } else {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Edit") {
                            isEditing = true
                        }
                    }
                }
            }
            .onAppear {
                loadUserData()
            }
            .alert(isPresented: $showingLogoutConfirmation) {
                Alert(
                    title: Text("Confirm Logout"),
                    message: Text("Are you sure you want to sign out of your account?"),
                    primaryButton: .destructive(Text("Logout")) {
                        userService.signOut()
                    },
                    secondaryButton: .cancel()
                )
            }
            .overlay(
                Group {
                    if showSuccessMessage {
                        VStack {
                            Spacer()
                            
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)
                                
                                Text("Profile updated successfully")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                            }
                            .padding()
                            .background(Color.green.opacity(0.2))
                            .cornerRadius(10)
                            .padding(.horizontal)
                            .padding(.bottom)
                        }
                        .transition(.move(edge: .bottom))
                        .animation(.easeInOut)
                        .onAppear {
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                                withAnimation {
                                    showSuccessMessage = false
                                }
                            }
                        }
                    }
                }
            )
        }
    }
    
    // MARK: - Section Views
    
    private var profileHeaderView: some View {
        HStack(spacing: 16) {
            Image(systemName: "person.circle.fill")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 80, height: 80)
                .foregroundColor(.blue)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(name)
                    .font(.title2)
                    .fontWeight(.bold)
                
                if let user = userService.currentUser {
                    HStack {
                        Text(user.subscriptionLevel.displayName)
                            .font(.subheadline)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(user.subscriptionLevel == .premium ? Color.blue.opacity(0.2) : Color.gray.opacity(0.2))
                            .foregroundColor(user.subscriptionLevel == .premium ? .blue : .gray)
                            .cornerRadius(6)
                        
                        if user.subscriptionLevel == .premium {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                        }
                    }
                }
                
                Text(email)
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
            
            Spacer()
        }
    }
    
    private func sectionView<Content: View>(title: String, content: Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .padding(.horizontal)
            
            content
                .padding(.vertical, 10)
                .background(Color.gray.opacity(0.05))
                .cornerRadius(12)
        }
        .padding(.horizontal)
    }
    
    private var accountInfoView: some View {
        VStack(spacing: 16) {
            if isEditing {
                // Editable form fields
                TextField("Name", text: $name)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal)
                
                TextField("Email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .padding(.horizontal)
                
                TextField("Phone Number (Optional)", text: $phoneNumber)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .keyboardType(.phonePad)
                    .padding(.horizontal)
            } else {
                // Display-only fields
                infoRow(title: "Name", value: name)
                infoRow(title: "Email", value: email)
                infoRow(title: "Phone", value: phoneNumber.isEmpty ? "Not provided" : phoneNumber)
            }
        }
    }
    
    private var preferencesView: some View {
        VStack(spacing: 16) {
            Toggle("Notifications", isOn: $notificationsEnabled)
                .disabled(!isEditing)
                .padding(.horizontal)
            
            Toggle("Dark Mode", isOn: $darkModeEnabled)
                .disabled(!isEditing)
                .padding(.horizontal)
            
            Toggle("Allow Usage Data Collection", isOn: $dataUsageConsent)
                .disabled(!isEditing)
                .padding(.horizontal)
        }
    }
    
    private var supportView: some View {
        VStack(spacing: 16) {
            NavigationLink(destination: FAQView()) {
                supportRow(icon: "questionmark.circle", title: "FAQ")
            }
            
            NavigationLink(destination: ContactSupportView()) {
                supportRow(icon: "envelope", title: "Contact Support")
            }
            
            NavigationLink(destination: PrivacyPolicyView()) {
                supportRow(icon: "lock.shield", title: "Privacy Policy")
            }
            
            NavigationLink(destination: TermsOfServiceView()) {
                supportRow(icon: "doc.text", title: "Terms of Service")
            }
        }
    }
    
    private var accountActionsView: some View {
        VStack(spacing: 16) {
            Button(action: {
                showingLogoutConfirmation = true
            }) {
                HStack {
                    Image(systemName: "arrow.right.square")
                        .foregroundColor(.red)
                    
                    Text("Sign Out")
                        .foregroundColor(.red)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .foregroundColor(.gray)
                }
                .padding(.horizontal)
            }
            
            Button(action: {
                showingDeleteAccountConfirmation = true
            }) {
                HStack {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                    
                    Text("Delete Account")
                        .foregroundColor(.red)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .foregroundColor(.gray)
                }
                .padding(.horizontal)
            }
            .alert(isPresented: $showingDeleteAccountConfirmation) {
                Alert(
                    title: Text("Delete Account"),
                    message: Text("Are you sure you want to delete your account? This action cannot be undone."),
                    primaryButton: .destructive(Text("Delete")) {
                        // In a real app, this would call an API to delete the account
                        // For this demo, just sign out
                        userService.signOut()
                    },
                    secondaryButton: .cancel()
                )
            }
        }
    }
    
    // MARK: - Helper UI Components
    
    private func infoRow(title: String, value: String) -> some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.gray)
                .frame(width: 80, alignment: .leading)
            
            Text(value)
                .font(.subheadline)
            
            Spacer()
        }
        .padding(.horizontal)
    }
    
    private func supportRow(icon: String, title: String) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 20)
            
            Text(title)
                .font(.subheadline)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundColor(.gray)
                .font(.caption)
        }
        .padding(.horizontal)
    }
    
    // MARK: - Data Management
    
    private func loadUserData() {
        if let user = userService.currentUser {
            name = user.name
            email = user.email
            phoneNumber = user.phoneNumber ?? ""
            notificationsEnabled = user.preferences.notificationsEnabled
            darkModeEnabled = user.preferences.darkModeEnabled
            dataUsageConsent = user.preferences.dataUsageConsent
        }
    }
    
    private func saveProfile() {
        isSaving = true
        
        let updatedPreferences = UserPreferences(
            notificationsEnabled: notificationsEnabled,
            darkModeEnabled: darkModeEnabled,
            dataUsageConsent: dataUsageConsent
        )
        
        userService.updateUserProfile(
            name: name,
            email: email,
            phoneNumber: phoneNumber.isEmpty ? nil : phoneNumber,
            preferences: updatedPreferences
        ) { success in
            isSaving = false
            
            if success {
                isEditing = false
                showSuccessMessage = true
            }
        }
    }
}

// MARK: - Placeholder Views

struct FAQView: View {
    var body: some View {
        List {
            Section(header: Text("General")) {
                FAQItem(question: "What is SymptomSentryAI?", answer: "SymptomSentryAI is a healthcare application that uses machine learning to analyze throat and ear images to identify potential conditions.")
                
                FAQItem(question: "How accurate are the analyses?", answer: "Our ML models provide confidence scores for each detected condition. These are meant as guidance only and not as a medical diagnosis.")
            }
            
            Section(header: Text("Subscriptions")) {
                FAQItem(question: "What's included in the free plan?", answer: "Free users can perform up to 2 analyses per month and access basic educational content.")
                
                FAQItem(question: "How do I cancel my subscription?", answer: "Premium subscriptions can be managed through your Apple ID settings in the App Store.")
            }
            
            Section(header: Text("Privacy")) {
                FAQItem(question: "How is my data protected?", answer: "We follow HIPAA and GDPR guidelines. Your images and analysis results are encrypted and stored securely.")
                
                FAQItem(question: "Can I delete my data?", answer: "Yes, you can request data deletion through the app or by contacting our support team.")
            }
        }
        .listStyle(InsetGroupedListStyle())
        .navigationTitle("FAQ")
    }
}

struct FAQItem: View {
    let question: String
    let answer: String
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: {
                withAnimation {
                    isExpanded.toggle()
                }
            }) {
                HStack {
                    Text(question)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            if isExpanded {
                Text(answer)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.top, 4)
            }
        }
        .padding(.vertical, 4)
    }
}

struct ContactSupportView: View {
    @State private var subject = ""
    @State private var message = ""
    @State private var showingSentConfirmation = false
    
    var body: some View {
        Form {
            Section(header: Text("Message Details")) {
                TextField("Subject", text: $subject)
                
                ZStack(alignment: .topLeading) {
                    if message.isEmpty {
                        Text("Describe your issue or question")
                            .foregroundColor(.gray)
                            .padding(.top, 8)
                            .padding(.leading, 5)
                    }
                    
                    TextEditor(text: $message)
                        .frame(minHeight: 150)
                }
            }
            
            Section {
                Button(action: {
                    // In a real app, this would send the support request
                    showingSentConfirmation = true
                }) {
                    Text("Send Message")
                        .frame(maxWidth: .infinity)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                .disabled(subject.isEmpty || message.isEmpty)
            }
        }
        .navigationTitle("Contact Support")
        .alert(isPresented: $showingSentConfirmation) {
            Alert(
                title: Text("Message Sent"),
                message: Text("Thank you for contacting support. We'll respond to your inquiry as soon as possible."),
                dismissButton: .default(Text("OK"))
            )
        }
    }
}

struct PrivacyPolicyView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Privacy Policy")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Last Updated: March 17, 2025")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                
                Text("This privacy policy describes how SymptomSentryAI collects, uses, and shares your personal information when you use our mobile application.")
                    .font(.body)
                
                Group {
                    Text("Information We Collect")
                        .font(.headline)
                        .padding(.top, 8)
                    
                    Text("We collect information you provide directly to us, including your name, email address, phone number, and health-related images you upload for analysis.")
                        .font(.body)
                }
                
                Group {
                    Text("How We Use Your Information")
                        .font(.headline)
                        .padding(.top, 8)
                    
                    Text("We use the information we collect to provide, maintain, and improve our services, including analyzing images for potential health conditions. We also use the information to communicate with you about updates, security alerts, and support messages.")
                        .font(.body)
                }
                
                Group {
                    Text("Data Security")
                        .font(.headline)
                        .padding(.top, 8)
                    
                    Text("We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage. All health data is encrypted both in transit and at rest.")
                        .font(.body)
                }
                
                Group {
                    Text("Your Rights")
                        .font(.headline)
                        .padding(.top, 8)
                    
                    Text("Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, or delete your data. Contact us to exercise these rights.")
                        .font(.body)
                }
            }
            .padding()
        }
        .navigationTitle("Privacy Policy")
    }
}

struct TermsOfServiceView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Terms of Service")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Last Updated: March 17, 2025")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                
                Text("By using the SymptomSentryAI application, you agree to these terms and conditions.")
                    .font(.body)
                
                Group {
                    Text("Services Description")
                        .font(.headline)
                        .padding(.top, 8)
                    
                    Text("SymptomSentryAI provides machine learning-based analysis of throat and ear images to identify potential health conditions. Our services are intended for informational purposes only and do not constitute medical advice, diagnosis, or treatment.")
                        .font(.body)
                }
                
                Group {
                    Text("Medical Disclaimer")
                        .font(.headline)
                        .padding(.top, 8)
                    
                    Text("The application is not intended to replace professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment of any health condition.")
                        .font(.body)
                        .foregroundColor(.red)
                }
                
                Group {
                    Text("User Accounts")
                        .font(.headline)
                        .padding(.top, 8)
                    
                    Text("You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.")
                        .font(.body)
                }
                
                Group {
                    Text("Subscription and Billing")
                        .font(.headline)
                        .padding(.top, 8)
                    
                    Text("Premium features require a subscription. Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period. Manage subscriptions through your Apple ID account settings.")
                        .font(.body)
                }
            }
            .padding()
        }
        .navigationTitle("Terms of Service")
    }
}

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
            .environmentObject(UserService.shared)
    }
}