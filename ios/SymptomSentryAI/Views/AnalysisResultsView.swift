import SwiftUI

struct AnalysisResultsView: View {
    // MARK: - Properties
    
    /// The image that was analyzed
    let image: UIImage
    
    /// The analysis response from the server
    let analysis: AnalysisResponse
    
    /// State for showing condition details
    @State private var selectedCondition: AnalysisCondition?
    
    /// Animation state
    @State private var animateResults = false
    
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
            // Animate the results appearing
            withAnimation(.easeOut(duration: 0.5)) {
                animateResults = true
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
            
            HStack {
                HStack {
                    Circle()
                        .fill(analysis.conditions.first?.confidence ?? 0 >= 0.7 ? Color.red : Color.green)
                        .frame(width: 12, height: 12)
                    
                    Text("Result:")
                        .font(.subheadline)
                        .bold()
                }
                
                if let topCondition = analysis.conditions.first {
                    Text(topCondition.confidence >= 0.7 ? 
                         "High likelihood of \(topCondition.name)" : 
                         "Possible indications detected")
                        .font(.subheadline)
                } else {
                    Text("No conditions detected")
                        .font(.subheadline)
                }
            }
            
            if let topCondition = analysis.conditions.first, topCondition.isPotentiallySerious && topCondition.confidence >= 0.7 {
                HStack(spacing: 4) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                    
                    Text("This may require medical attention")
                        .font(.subheadline)
                        .foregroundColor(.red)
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .background(Color.red.opacity(0.1))
                .cornerRadius(8)
                .padding(.top, 8)
            }
        }
    }
    
    private var conditionsList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Potential Conditions")
                .font(.headline)
            
            ForEach(analysis.conditions) { condition in
                Button(action: {
                    selectedCondition = condition
                }) {
                    ConditionRowView(condition: condition)
                }
                .buttonStyle(PlainButtonStyle())
            }
            
            if analysis.conditions.isEmpty {
                Text("No conditions identified")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .padding(.vertical, 10)
            }
        }
    }
    
    private var actionButtons: some View {
        VStack(spacing: 12) {
            Button(action: {
                // This would navigate to educational content for the top condition
            }) {
                HStack {
                    Image(systemName: "book.fill")
                    Text("Learn About This Condition")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(analysis.conditions.isEmpty)
            
            Button(action: {
                // This would connect the user to telemedicine
            }) {
                HStack {
                    Image(systemName: "video.fill")
                    Text("Connect With Doctor")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(10)
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
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text(condition.name)
                        .font(.largeTitle)
                        .bold()
                    
                    HStack {
                        Text("Confidence: \(condition.confidencePercentage)")
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color(condition.confidenceBadgeColor).opacity(0.2))
                            .cornerRadius(8)
                        
                        if condition.isPotentiallySerious {
                            HStack(spacing: 4) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundColor(.red)
                                
                                Text("Potentially Serious")
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(8)
                        }
                    }
                }
                
                Divider()
                
                // Description
                VStack(alignment: .leading, spacing: 8) {
                    Text("About this Condition")
                        .font(.headline)
                    
                    Text(condition.description)
                        .font(.body)
                }
                
                Divider()
                
                // Symptoms
                VStack(alignment: .leading, spacing: 12) {
                    Text("Common Symptoms")
                        .font(.headline)
                    
                    ForEach(condition.symptoms, id: \.self) { symptom in
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: "circle.fill")
                                .font(.system(size: 8))
                                .padding(.top, 5)
                            
                            Text(symptom)
                                .font(.body)
                        }
                    }
                }
                
                Divider()
                
                // Action buttons
                VStack(spacing: 12) {
                    Button(action: {
                        // Learn more action
                    }) {
                        HStack {
                            Image(systemName: "book.fill")
                            Text("Learn More")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    
                    Button(action: {
                        // Medical advice action
                    }) {
                        HStack {
                            Image(systemName: "video.fill")
                            Text("Consult a Doctor")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                }
                
                Text("Disclaimer: This analysis is for informational purposes only and should not be considered as medical advice. Always consult with a qualified healthcare provider for proper diagnosis and treatment.")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 20)
            }
            .padding()
        }
        .navigationBarTitle("", displayMode: .inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Close") {
                    presentationMode.wrappedValue.dismiss()
                }
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