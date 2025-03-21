import SwiftUI
import Combine

struct AnalysisResultsView: View {
    // MARK: - Properties
    
    /// The image that was analyzed
    let image: UIImage
    
    /// The analysis response from the server
    let analysis: AnalysisResponse
    
    /// State for showing condition details
    @State private var selectedCondition: AnalysisCondition?
    
    /// Animation states
    @State private var animateResults = false
    @State private var pulseHighConfidence = false
    @State private var showHeartbeatEffect = false
    
    /// User authentication service
    @EnvironmentObject var userService: UserService
    
    /// State for save operation
    @State private var isSaving = false
    @State private var saveMessage: String?
    @State private var showLoginPrompt = false
    
    // MARK: - Body
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Analysis header
                header
                
                // Image section
                imageSection
                
                // Results summary
                resultsSummary
                    .padding(.top, 10)
                
                // Conditions list
                conditionsList
                    .padding(.top, 5)
                
                // Action buttons
                actionButtons
                    .padding(.top, 20)
            }
            .padding()
            .opacity(animateResults ? 1 : 0)
            .offset(y: animateResults ? 0 : 20)
        }
        .navigationTitle("Analysis Results")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    // Share report functionality would go here
                }) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
        }
        .onAppear {
            // Sequence of animations for a more engaging experience
            withAnimation(.easeOut(duration: 0.5)) {
                animateResults = true
            }
            
            // Start pulsing animation for high confidence results after a slight delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                pulseHighConfidence = true
            }
            
            // Start heartbeat effect for serious conditions after a slight delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                showHeartbeatEffect = true
            }
        }
        .sheet(item: $selectedCondition) { condition in
            NavigationView {
                ConditionDetailView(condition: condition)
            }
        }
    }
    
    // MARK: - View Components
    
    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Analysis Complete")
                .font(.title)
                .bold()
            
            Text("Type: \(analysis.type.capitalized) Analysis")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Text("Completed on \(analysis.formattedDate)")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
    
    private var imageSection: some View {
        VStack(alignment: .center, spacing: 12) {
            Image(uiImage: image)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(maxHeight: 250)
                .cornerRadius(12)
                .shadow(radius: 4)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )
            
            Text("Image ID: \(analysis.id.prefix(8))")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
    
    private var resultsSummary: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Analysis Results")
                .font(.headline)
                .transition(AnimationUtility.Transition.slide)
            
            HStack {
                HStack {
                    // Pulsing indicator for high confidence results
                    Circle()
                        .fill(analysis.conditions.first?.confidence ?? 0 >= 0.7 ? Color.red : Color.green)
                        .frame(width: 12, height: 12)
                        .scaleEffect(pulseHighConfidence && (analysis.conditions.first?.confidence ?? 0) >= 0.7 ? 1.3 : 1.0)
                        .animation(
                            Animation.easeInOut(duration: 0.6)
                                .repeatForever(autoreverses: true),
                            value: pulseHighConfidence
                        )
                    
                    Text("Result:")
                        .font(.subheadline)
                        .bold()
                }
                
                if let topCondition = analysis.conditions.first {
                    Text(topCondition.confidence >= 0.7 ? 
                         "High likelihood of \(topCondition.name)" : 
                         "Possible indications detected")
                        .font(.subheadline)
                        .transition(.opacity)
                        .id("result-\(topCondition.name)")
                } else {
                    Text("No conditions detected")
                        .font(.subheadline)
                }
            }
            .transition(AnimationUtility.Transition.scale)
            
            if let topCondition = analysis.conditions.first, topCondition.isPotentiallySerious && topCondition.confidence >= 0.7 {
                HStack(spacing: 4) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                        .scaleEffect(showHeartbeatEffect ? 1.2 : 1.0)
                        .animation(
                            Animation.easeInOut(duration: 0.4)
                                .repeatForever(autoreverses: true),
                            value: showHeartbeatEffect
                        )
                    
                    Text("This may require medical attention")
                        .font(.subheadline)
                        .foregroundColor(.red)
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .background(Color.red.opacity(0.1))
                .cornerRadius(8)
                .padding(.top, 8)
                .transition(AnimationUtility.Transition.scale)
                .modifier(BreathingEffect())
            }
        }
    }
    
    private var conditionsList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Potential Conditions")
                .font(.headline)
                .transition(AnimationUtility.Transition.slide)
            
            // Staggered animation for condition cards
            ForEach(Array(analysis.conditions.enumerated()), id: \.element.id) { index, condition in
                Button(action: {
                    withAnimation(AnimationUtility.Curve.spring) {
                        selectedCondition = condition
                    }
                }) {
                    ConditionRowView(condition: condition)
                        .opacity(animateResults ? 1 : 0)
                        .offset(x: animateResults ? 0 : 20)
                        // Stagger the animation of each condition card
                        .animation(
                            .easeOut(duration: 0.5)
                                .delay(Double(index) * 0.15 + 0.3),
                            value: animateResults
                        )
                }
                .buttonStyle(PlainButtonStyle())
                .transition(AnimationUtility.Transition.scale)
            }
            
            if analysis.conditions.isEmpty {
                Text("No conditions identified")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .padding(.vertical, 10)
                    .opacity(animateResults ? 1 : 0)
                    .animation(.easeOut(duration: 0.5).delay(0.3), value: animateResults)
            }
        }
    }
    
    private var actionButtons: some View {
        VStack(spacing: 12) {
            // Save Results Button
            VStack(spacing: 4) {
                Button(action: {
                    if userService.isAuthenticated {
                        saveAnalysisResults()
                    } else {
                        showLoginPrompt = true
                    }
                }) {
                    HStack {
                        Image(systemName: "square.and.arrow.down")
                            .imageScale(.large)
                            .symbolEffect(.pulse, options: .repeating, value: isSaving)
                        Text(isSaving ? "Saving..." : "Save Results")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(userService.isAuthenticated ? Color.purple : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .disabled(isSaving || analysis.conditions.isEmpty)
                .opacity(animateResults ? 1 : 0)
                .offset(y: animateResults ? 0 : 20)
                .animation(.easeOut(duration: 0.5).delay(0.5), value: animateResults)
                
                // Login prompt if user is not authenticated
                if !userService.isAuthenticated {
                    Button(action: {
                        // Navigate to login screen
                        showLoginPrompt = true
                    }) {
                        Text("Sign in to save results")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                    .padding(.top, 2)
                    .opacity(animateResults ? 1 : 0)
                    .offset(y: animateResults ? 0 : 10)
                    .animation(.easeOut(duration: 0.5).delay(0.6), value: animateResults)
                }
                
                // Show message after save attempt
                if let message = saveMessage {
                    Text(message)
                        .font(.caption)
                        .foregroundColor(message.contains("successfully") ? .green : .red)
                        .padding(.top, 4)
                        .transition(.opacity)
                }
            }
            
            // Learn About This Condition Button
            Button(action: {
                // This would navigate to educational content for the top condition
            }) {
                HStack {
                    Image(systemName: "book.fill")
                        .imageScale(.large)
                        .symbolEffect(.pulse, options: .repeating, value: animateResults)
                    Text("Learn About This Condition")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(analysis.conditions.isEmpty)
            .opacity(animateResults ? 1 : 0)
            .offset(y: animateResults ? 0 : 20)
            .animation(.easeOut(duration: 0.5).delay(0.7), value: animateResults)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color.blue.opacity(0.7), lineWidth: 2)
                    .scaleEffect(pulseHighConfidence ? 1.05 : 1)
                    .opacity(pulseHighConfidence ? 0.6 : 0)
                    .animation(
                        Animation.easeInOut(duration: 1.5)
                            .repeatForever(autoreverses: true),
                        value: pulseHighConfidence
                    )
            )
            
            // Connect With Doctor Button
            Button(action: {
                // This would connect the user to telemedicine
            }) {
                HStack {
                    Image(systemName: "video.fill")
                        .imageScale(.large)
                        .symbolEffect(.bounce.up, options: .repeating, value: showHeartbeatEffect)
                    Text("Connect With Doctor")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .opacity(animateResults ? 1 : 0)
            .offset(y: animateResults ? 0 : 20)
            .animation(.easeOut(duration: 0.5).delay(0.9), value: animateResults)
            .shadow(color: Color.green.opacity(0.3), radius: 5, x: 0, y: 2)
        }
        .sheet(isPresented: $showLoginPrompt) {
            LoginView(onComplete: { success in
                showLoginPrompt = false
                if success && userService.isAuthenticated {
                    // Automatically save the results if the user just logged in
                    saveAnalysisResults()
                }
            })
        }
    }
    
    /// Save the analysis results to the user's account
    private func saveAnalysisResults() {
        guard userService.isAuthenticated, let authToken = userService.authToken else {
            saveMessage = "You need to be logged in to save results"
            return
        }
        
        isSaving = true
        saveMessage = nil
        
        // In a real app, this would make an API request to save the analysis
        // For this demonstration, we'll simulate a server response
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            // Simulate success
            self.isSaving = false
            self.saveMessage = "Results saved successfully!"
            
            // Hide the message after a few seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                withAnimation {
                    self.saveMessage = nil
                }
            }
        }
    }
}

// MARK: - Supporting Views

/// Row view for displaying a single condition in the list
struct ConditionRowView: View {
    let condition: AnalysisCondition
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(condition.name)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(condition.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(condition.confidencePercentage)
                    .font(.headline)
                    .foregroundColor(condition.isHighConfidence ? .red : .primary)
                
                Text("confidence")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
                .font(.caption)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(
                    Color(condition.confidenceBadgeColor).opacity(0.5),
                    lineWidth: 1
                )
        )
        .shadow(
            color: Color.black.opacity(0.05),
            radius: 2,
            x: 0,
            y: 1
        )
    }
}

/// Detailed view for a single condition
struct ConditionDetailView: View {
    let condition: AnalysisCondition
    @Environment(\.presentationMode) var presentationMode
    
    // Animation states
    @State private var animateContent = false
    @State private var showHeartbeatEffect = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text(condition.name)
                        .font(.largeTitle)
                        .bold()
                        .opacity(animateContent ? 1 : 0)
                        .offset(y: animateContent ? 0 : 10)
                        .animation(.easeOut(duration: 0.4), value: animateContent)
                    
                    HStack {
                        Text("Confidence: \(condition.confidencePercentage)")
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color(condition.confidenceBadgeColor).opacity(0.2))
                            .cornerRadius(8)
                            .opacity(animateContent ? 1 : 0)
                            .animation(.easeOut(duration: 0.4).delay(0.1), value: animateContent)
                        
                        if condition.isPotentiallySerious {
                            HStack(spacing: 4) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundColor(.red)
                                    .scaleEffect(showHeartbeatEffect ? 1.2 : 1.0)
                                    .animation(
                                        Animation.easeInOut(duration: 0.4)
                                            .repeatForever(autoreverses: true),
                                        value: showHeartbeatEffect
                                    )
                                
                                Text("Potentially Serious")
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(8)
                            .transition(AnimationUtility.Transition.scale)
                            .opacity(animateContent ? 1 : 0)
                            .animation(.easeOut(duration: 0.4).delay(0.2), value: animateContent)
                        }
                    }
                }
                
                Divider()
                    .opacity(animateContent ? 1 : 0)
                    .animation(.easeOut(duration: 0.4).delay(0.3), value: animateContent)
                
                // Description
                VStack(alignment: .leading, spacing: 8) {
                    Text("About this Condition")
                        .font(.headline)
                        .opacity(animateContent ? 1 : 0)
                        .animation(.easeOut(duration: 0.4).delay(0.4), value: animateContent)
                    
                    Text(condition.description)
                        .font(.body)
                        .opacity(animateContent ? 1 : 0)
                        .animation(.easeOut(duration: 0.4).delay(0.5), value: animateContent)
                }
                
                Divider()
                    .opacity(animateContent ? 1 : 0)
                    .animation(.easeOut(duration: 0.4).delay(0.6), value: animateContent)
                
                // Symptoms
                VStack(alignment: .leading, spacing: 12) {
                    Text("Common Symptoms")
                        .font(.headline)
                        .opacity(animateContent ? 1 : 0)
                        .animation(.easeOut(duration: 0.4).delay(0.7), value: animateContent)
                    
                    ForEach(Array(condition.symptoms.enumerated()), id: \.element) { index, symptom in
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: "circle.fill")
                                .font(.system(size: 8))
                                .padding(.top, 5)
                            
                            Text(symptom)
                                .font(.body)
                        }
                        .opacity(animateContent ? 1 : 0)
                        .offset(x: animateContent ? 0 : -10)
                        .animation(.easeOut(duration: 0.4).delay(0.8 + Double(index) * 0.1), value: animateContent)
                    }
                }
                
                Divider()
                    .opacity(animateContent ? 1 : 0)
                    .animation(.easeOut(duration: 0.4).delay(0.9), value: animateContent)
                
                // Action buttons
                VStack(spacing: 12) {
                    Button(action: {
                        // Learn more action
                    }) {
                        HStack {
                            Image(systemName: "book.fill")
                                .imageScale(.large)
                            Text("Learn More")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .opacity(animateContent ? 1 : 0)
                    .offset(y: animateContent ? 0 : 20)
                    .animation(.easeOut(duration: 0.5).delay(1.0), value: animateContent)
                    
                    Button(action: {
                        // Medical advice action
                    }) {
                        HStack {
                            Image(systemName: "video.fill")
                                .imageScale(.large)
                            Text("Consult a Doctor")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .opacity(animateContent ? 1 : 0)
                    .offset(y: animateContent ? 0 : 20)
                    .animation(.easeOut(duration: 0.5).delay(1.1), value: animateContent)
                }
                
                Text("Disclaimer: This analysis is for informational purposes only and should not be considered as medical advice. Always consult with a qualified healthcare provider for proper diagnosis and treatment.")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 20)
                    .opacity(animateContent ? 0.7 : 0)
                    .animation(.easeOut(duration: 0.5).delay(1.2), value: animateContent)
            }
            .padding()
        }
        .navigationBarTitle("", displayMode: .inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Close") {
                    withAnimation(AnimationUtility.Curve.standard) {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
        .onAppear {
            // Start content animations with small delay to allow modal presentation to complete
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                animateContent = true
            }
            
            // Start heartbeat effect for serious conditions after a slight delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                showHeartbeatEffect = true
            }
        }
    }
}

// MARK: - Previews

struct AnalysisResultsView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            AnalysisResultsView(
                image: UIImage(systemName: "photo") ?? UIImage(),
                analysis: AnalysisResponse.mockData
            )
        }
    }
}