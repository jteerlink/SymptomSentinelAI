import SwiftUI

struct AnalysisResultsView: View {
    let results: [AnalysisCondition]
    let analysisType: ImageUploadView.AnalysisType
    let image: UIImage?
    
    @Environment(\.presentationMode) private var presentationMode
    @State private var selectedCondition: AnalysisCondition?
    @State private var isShowingDetailView = false
    @State private var isSaved = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header with image
                    resultHeader
                    
                    // Results summary
                    resultsSummary
                    
                    // Conditions list
                    conditionsList
                    
                    // Disclaimer
                    disclaimerSection
                    
                    // Action buttons
                    actionButtons
                }
                .padding()
            }
            .navigationTitle("Analysis Results")
            .navigationBarItems(
                leading: Button(action: {
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Text("Close")
                },
                trailing: Button(action: saveAnalysis) {
                    if isSaved {
                        Label("Saved", systemImage: "checkmark")
                    } else {
                        Label("Save", systemImage: "square.and.arrow.down")
                    }
                }
            )
            .sheet(isPresented: $isShowingDetailView) {
                if let condition = selectedCondition {
                    ConditionDetailView(condition: condition)
                }
            }
        }
    }
    
    // MARK: - Result Header
    private var resultHeader: some View {
        VStack(spacing: 15) {
            if let image = image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(maxHeight: 200)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                    )
            }
            
            HStack {
                Image(systemName: analysisType == .throat ? "mouth" : "ear")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 24, height: 24)
                    .foregroundColor(.blue)
                
                Text("\(analysisType.rawValue) Analysis")
                    .font(.headline)
                
                Spacer()
                
                Text(Date(), style: .date)
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
            .padding(.top, 5)
            
            Divider()
        }
    }
    
    // MARK: - Results Summary
    private var resultsSummary: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let topCondition = results.first {
                Text("Top Potential Condition")
                    .font(.headline)
                
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(topCondition.name)
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        Text(topCondition.shortDescription)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                    
                    Spacer()
                    
                    // Confidence indicator
                    confidenceIndicator(for: topCondition)
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.blue.opacity(0.1))
                )
            } else {
                Text("No conditions detected")
                    .font(.headline)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    // MARK: - Conditions List
    private var conditionsList: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("All Potential Conditions")
                .font(.headline)
            
            ForEach(results) { condition in
                Button(action: {
                    selectedCondition = condition
                    isShowingDetailView = true
                }) {
                    HStack {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(condition.name)
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            if !condition.shortDescription.isEmpty {
                                Text(condition.shortDescription)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                            }
                        }
                        
                        Spacer()
                        
                        // Confidence percentage
                        Text("\(Int(condition.confidence * 100))%")
                            .font(.headline)
                            .foregroundColor(confidenceColor(for: condition.confidence))
                        
                        Image(systemName: "chevron.right")
                            .foregroundColor(.gray)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                    )
                }
            }
        }
    }
    
    // MARK: - Disclaimer Section
    private var disclaimerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Important Disclaimer")
                .font(.headline)
                .foregroundColor(.red)
            
            Text("This analysis is for educational purposes only and does not constitute medical advice. Always consult with a healthcare professional for proper diagnosis and treatment.")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.red.opacity(0.1))
        )
    }
    
    // MARK: - Action Buttons
    private var actionButtons: some View {
        HStack(spacing: 15) {
            Button(action: {
                // Share results
                let sharableText = createShareableContent()
                let activityVC = UIActivityViewController(
                    activityItems: [sharableText],
                    applicationActivities: nil
                )
                
                if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                   let rootVC = windowScene.windows.first?.rootViewController {
                    rootVC.present(activityVC, animated: true, completion: nil)
                }
            }) {
                Label("Share Results", systemImage: "square.and.arrow.up")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
            }
            
            Button(action: {
                // Book telemedicine appointment - this would typically navigate to a booking view
                // For now, we'll dismiss this view and could show another screen
                presentationMode.wrappedValue.dismiss()
            }) {
                Label("Get Medical Advice", systemImage: "video")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .foregroundColor(.white)
                    .background(Color.blue)
                    .cornerRadius(10)
            }
        }
        .padding(.top, 10)
    }
    
    // MARK: - Helper Views
    
    private func confidenceIndicator(for condition: AnalysisCondition) -> some View {
        VStack(alignment: .center, spacing: 5) {
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.3), lineWidth: 4)
                    .frame(width: 60, height: 60)
                
                Circle()
                    .trim(from: 0, to: CGFloat(min(condition.confidence, 1.0)))
                    .stroke(confidenceColor(for: condition.confidence), lineWidth: 4)
                    .frame(width: 60, height: 60)
                    .rotationEffect(Angle(degrees: -90))
                
                Text("\(Int(condition.confidence * 100))%")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(confidenceColor(for: condition.confidence))
            }
            
            Text("Confidence")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
    
    private func confidenceColor(for confidence: Double) -> Color {
        if confidence >= 0.7 {
            return .red
        } else if confidence >= 0.4 {
            return .orange
        } else {
            return .green
        }
    }
    
    // MARK: - Helper Methods
    
    private func saveAnalysis() {
        // Save the analysis to history
        // In a real app, this would call a service to save to a database
        isSaved = true
        
        // Simulate API call
        // AnalysisService.shared.saveAnalysis(...)
    }
    
    private func createShareableContent() -> String {
        var content = "SymptomSentry AI Analysis Results\n"
        content += "Type: \(analysisType.rawValue)\n"
        content += "Date: \(Date().formatted())\n\n"
        
        content += "Potential Conditions:\n"
        for (index, condition) in results.enumerated() {
            content += "\(index + 1). \(condition.name) - \(Int(condition.confidence * 100))% confidence\n"
        }
        
        content += "\nDisclaimer: This analysis is for educational purposes only and does not constitute medical advice."
        
        return content
    }
}

// MARK: - Condition Detail View
struct ConditionDetailView: View {
    let condition: AnalysisCondition
    @Environment(\.presentationMode) private var presentationMode
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Condition header
                    HStack {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(condition.name)
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            if !condition.medicalTerm.isEmpty {
                                Text("Medical term: \(condition.medicalTerm)")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        Spacer()
                        
                        // Confidence percentage
                        ZStack {
                            Circle()
                                .fill(Color.blue.opacity(0.1))
                                .frame(width: 70, height: 70)
                            
                            Text("\(Int(condition.confidence * 100))%")
                                .font(.title3)
                                .fontWeight(.semibold)
                                .foregroundColor(.blue)
                        }
                    }
                    .padding()
                    .background(Color.blue.opacity(0.05))
                    .cornerRadius(12)
                    
                    // Description
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Description")
                            .font(.headline)
                        
                        Text(condition.description)
                            .foregroundColor(.secondary)
                    }
                    
                    // Symptoms
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Common Symptoms")
                            .font(.headline)
                        
                        ForEach(condition.symptoms, id: \.self) { symptom in
                            HStack(alignment: .top) {
                                Image(systemName: "circle.fill")
                                    .resizable()
                                    .frame(width: 6, height: 6)
                                    .foregroundColor(.blue)
                                    .padding(.top, 7)
                                
                                Text(symptom)
                                    .foregroundColor(.secondary)
                                
                                Spacer()
                            }
                        }
                    }
                    
                    // Treatment options
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Typical Treatments")
                            .font(.headline)
                        
                        ForEach(condition.treatments, id: \.self) { treatment in
                            HStack(alignment: .top) {
                                Image(systemName: "circle.fill")
                                    .resizable()
                                    .frame(width: 6, height: 6)
                                    .foregroundColor(.green)
                                    .padding(.top, 7)
                                
                                Text(treatment)
                                    .foregroundColor(.secondary)
                                
                                Spacer()
                            }
                        }
                    }
                    
                    // When to see a doctor
                    VStack(alignment: .leading, spacing: 10) {
                        Text("When to See a Doctor")
                            .font(.headline)
                            .foregroundColor(.red)
                        
                        Text(condition.whenToSeeDoctor)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.red.opacity(0.05))
                    .cornerRadius(10)
                    
                    // Disclaimer
                    Text("This information is for educational purposes only and should not replace professional medical advice.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.top)
                }
                .padding()
            }
            .navigationTitle("Condition Details")
            .navigationBarItems(
                trailing: Button(action: {
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Text("Close")
                }
            )
        }
    }
}