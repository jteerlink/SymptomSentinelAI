import SwiftUI

/**
 * AnalysisView
 *
 * This view displays the results of the image analysis after upload.
 * It shows:
 * - The uploaded image
 * - Analysis results with confidence scores
 * - Possible conditions with descriptions
 * - Recommended next steps
 */
struct AnalysisView: View {
    // MARK: - Properties
    
    // Analysis data
    let image: UIImage
    let type: MLAnalysisService.AnalysisType
    
    // Services
    @StateObject private var analysisService = AnalysisService.shared
    
    // State
    @State private var isLoading = true
    @State private var loadingMessage = "Analyzing your image..."
    @State private var analysisResults: [AnalysisCondition] = []
    @State private var errorMessage: String?
    @State private var analysisResponse: AnalysisResponse?
    
    // MARK: - Body
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Image section
                VStack(spacing: 12) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 250)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
                        )
                    
                    Text(type.displayName)
                        .font(.headline)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal)
                
                if isLoading {
                    // Loading indicator
                    VStack(spacing: 16) {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .scaleEffect(1.5)
                        
                        Text(loadingMessage)
                            .font(.headline)
                            .foregroundColor(.primary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                } else if let errorMessage = errorMessage {
                    // Error message
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 40))
                            .foregroundColor(.red)
                        
                        Text("Analysis Error")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text(errorMessage)
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    .padding(.vertical, 30)
                } else {
                    // Results section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Analysis Results")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        // Disclaimer
                        DisclaimerView()
                        
                        // Results
                        ForEach(analysisResults) { condition in
                            ConditionCardView(condition: condition)
                        }
                        
                        // Next steps section
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Recommended Next Steps")
                                .font(.headline)
                                .padding(.top)
                            
                            NextStepRowView(
                                step: "Consult with a healthcare professional",
                                description: "This analysis is not a diagnosis. Always consult with a qualified healthcare provider.",
                                systemImage: "person.crop.circle.badge.checkmark"
                            )
                            
                            NextStepRowView(
                                step: "Learn more",
                                description: "Tap the conditions above to read more about symptoms and treatments.",
                                systemImage: "book.fill"
                            )
                            
                            NextStepRowView(
                                step: "Save this analysis",
                                description: "Save this analysis to your health record for future reference.",
                                systemImage: "square.and.arrow.down"
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                
                Spacer(minLength: 40)
                
                // Action buttons
                if !isLoading {
                    HStack(spacing: 20) {
                        // Only show save button if not already saved
                        if let response = analysisResponse, !analysisService.savedAnalyses.contains(where: { $0.id == response.id }) {
                            ActionButton(
                                title: "Save",
                                systemImage: "square.and.arrow.down",
                                color: .blue
                            ) {
                                if let result = analysisResponse {
                                    // Save to local and server storage
                                    analysisService.saveAnalysisLocally(result)
                                }
                            }
                        } else {
                            // Show a disabled "Saved" button
                            ActionButton(
                                title: "Saved",
                                systemImage: "checkmark.circle",
                                color: .gray
                            ) {
                                // Already saved
                            }
                        }
                        
                        ActionButton(
                            title: "Share",
                            systemImage: "square.and.arrow.up",
                            color: .green
                        ) {
                            // Share using activity sheet
                            if let analysisResult = analysisResponse {
                                let text = "Analysis Results for \(type.displayName):\n"
                                + analysisResult.conditions.map { condition in
                                    "\(condition.name): \(condition.confidencePercentage)"
                                }.joined(separator: "\n")
                                
                                let activityItems: [Any] = [text, image]
                                
                                // Show activity sheet (in real implementation)
                                // UIApplication.shared.windows.first?.rootViewController?.present(
                                //    UIActivityViewController(activityItems: activityItems, applicationActivities: nil),
                                //    animated: true
                                // )
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 20)
                }
            }
            .padding(.top)
        }
        .navigationTitle("Analysis Results")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            // Start the analysis when the view appears
            performAnalysis()
        }
    }
    
    // MARK: - Methods
    
    /// Perform the analysis on the image
    private func performAnalysis() {
        // Use our analysis service to analyze and save the image
        let analysisTask = analysisService.analyzeAndSaveImage(image, type: type)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    guard let self = self else { return }
                    self.isLoading = false
                    
                    if case .failure(let error) = completion {
                        self.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    guard let self = self else { return }
                    self.isLoading = false
                    self.analysisResponse = response
                    self.analysisResults = response.conditions
                }
            )
            .store(in: &cancellables)
    }
    
    // For storing cancellables
    private var cancellables = Set<AnyCancellable>()
}

// MARK: - Supporting Views

/// Card view for displaying a potential condition
struct ConditionCardView: View {
    let condition: AnalysisCondition
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header with condition name and confidence
            Button(action: {
                withAnimation {
                    isExpanded.toggle()
                }
            }) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(condition.name)
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text("Confidence: \(condition.confidencePercentage)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.down")
                        .rotationEffect(.degrees(isExpanded ? 180 : 0))
                        .foregroundColor(.blue)
                }
                .padding(.vertical, 12)
                .padding(.horizontal, 16)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color(UIColor.systemBackground))
                        .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
                )
            }
            
            // Expandable detail section
            if isExpanded {
                VStack(alignment: .leading, spacing: 12) {
                    Text(condition.description)
                        .font(.body)
                        .foregroundColor(.secondary)
                    
                    if !condition.symptoms.isEmpty {
                        Text("Common Symptoms")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        ForEach(condition.symptoms, id: \.self) { symptom in
                            HStack(alignment: .top, spacing: 8) {
                                Image(systemName: "circle.fill")
                                    .font(.system(size: 6))
                                    .foregroundColor(.blue)
                                    .padding(.top, 6)
                                
                                Text(symptom)
                                    .font(.body)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    
                    Button(action: {
                        // Action to learn more about this condition
                    }) {
                        Text("Learn More")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.blue)
                    }
                    .padding(.top, 8)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color(UIColor.systemBackground).opacity(0.6))
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
        )
        .padding(.vertical, 4)
    }
}

/// Row view for next steps
struct NextStepRowView: View {
    let step: String
    let description: String
    let systemImage: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: systemImage)
                .foregroundColor(.blue)
                .frame(width: 24, height: 24)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(step)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }
}

/// Action button for save/share
struct ActionButton: View {
    let title: String
    let systemImage: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: systemImage)
                Text(title)
                    .fontWeight(.medium)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(color)
            .foregroundColor(.white)
            .cornerRadius(10)
        }
    }
}

/// Medical disclaimer view
struct DisclaimerView: View {
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .foregroundColor(.orange)
            
            Text("This analysis is for informational purposes only and does not constitute medical advice. Please consult with a healthcare professional for proper diagnosis.")
                .font(.footnote)
                .foregroundColor(.secondary)
        }
        .padding(12)
        .background(Color.orange.opacity(0.1))
        .cornerRadius(8)
        .padding(.bottom, 8)
    }
}

struct AnalysisView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            AnalysisView(
                image: UIImage(systemName: "photo")!,
                type: MLAnalysisService.AnalysisType.throat
            )
        }
    }
}