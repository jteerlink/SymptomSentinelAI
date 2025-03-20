import SwiftUI

struct AnalysisView: View {
    // Service access
    @EnvironmentObject var userService: UserService
    
    // State
    @State private var showingLimitExceededAlert = false
    @State private var showingHistoryView = false
    
    var body: some View {
        NavigationView {
            // Use our new ImageUploadView with integrated analysis
            ImageUploadView()
                .navigationBarItems(
                    trailing: Button(action: {
                        showingHistoryView = true
                    }) {
                        HStack {
                            Image(systemName: "clock.arrow.circlepath")
                            Text("History")
                        }
                    }
                )
                .sheet(isPresented: $showingHistoryView) {
                    AnalysisHistoryView()
                }
        }
    }
}

// Analysis History View to show past analyses
struct AnalysisHistoryView: View {
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var userService: UserService
    @State private var historyItems: [AnalysisHistoryItem] = []
    @State private var isLoading = true
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    ProgressView("Loading history...")
                        .onAppear {
                            loadHistory()
                        }
                } else if historyItems.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "clock")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 80, height: 80)
                            .foregroundColor(.gray)
                        
                        Text("No Analysis History")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text("Your previous analyses will appear here")
                            .font(.body)
                            .foregroundColor(.gray)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    .padding()
                } else {
                    List {
                        ForEach(historyItems) { item in
                            NavigationLink(destination: HistoryDetailView(historyItem: item)) {
                                HistoryItemRow(item: item)
                            }
                        }
                    }
                    .listStyle(InsetGroupedListStyle())
                }
            }
            .navigationTitle("Analysis History")
            .navigationBarItems(trailing: Button("Done") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
    
    private func loadHistory() {
        // Fetch analysis history from UserService
        userService.getAnalysisHistory { result in
            isLoading = false
            switch result {
            case .success(let items):
                self.historyItems = items
            case .failure:
                // Handle error - show empty state for now
                self.historyItems = []
            }
        }
    }
}

// History item model
struct AnalysisHistoryItem: Identifiable {
    let id: String
    let date: Date
    let type: String // "throat" or "ear"
    let topConditionName: String
    let topConditionConfidence: Double
    let imageReference: String
    let conditions: [AnalysisCondition]
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// Row view for a history item in the list
struct HistoryItemRow: View {
    let item: AnalysisHistoryItem
    
    var body: some View {
        HStack {
            // Type icon
            Image(systemName: item.type == "throat" ? "mouth" : "ear")
                .font(.system(size: 24))
                .foregroundColor(.blue)
                .frame(width: 40, height: 40)
                .background(Color.blue.opacity(0.1))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.topConditionName)
                    .font(.headline)
                
                Text("\(item.formattedDate) • \(item.type.capitalized)")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            // Confidence indicator
            ZStack {
                Circle()
                    .trim(from: 0, to: CGFloat(item.topConditionConfidence))
                    .stroke(
                        item.topConditionConfidence > 0.7 ? Color.red :
                            item.topConditionConfidence > 0.4 ? Color.orange : Color.green,
                        lineWidth: 3
                    )
                    .frame(width: 30, height: 30)
                    .rotationEffect(.degrees(-90))
                
                Text("\(Int(item.topConditionConfidence * 100))%")
                    .font(.system(size: 8, weight: .bold))
            }
        }
        .padding(.vertical, 8)
    }
}

// Detail view for a history item
struct HistoryDetailView: View {
    let historyItem: AnalysisHistoryItem
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(historyItem.formattedDate)
                            .font(.subheadline)
                            .foregroundColor(.gray)
                        
                        Text("\(historyItem.type.capitalized) Analysis")
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                    
                    Spacer()
                    
                    Image(systemName: historyItem.type == "throat" ? "mouth" : "ear")
                        .font(.system(size: 24))
                        .foregroundColor(.white)
                        .frame(width: 50, height: 50)
                        .background(Color.blue)
                        .clipShape(Circle())
                }
                .padding(.horizontal)
                
                // Results
                VStack(alignment: .leading, spacing: 10) {
                    Text("Analysis Results")
                        .font(.headline)
                        .padding(.horizontal)
                    
                    ForEach(historyItem.conditions) { condition in
                        ConditionCardView(condition: condition)
                            .padding(.horizontal)
                    }
                }
                
                // Disclaimer
                DisclaimerView()
            }
            .padding(.vertical)
        }
        .navigationTitle("Analysis Details")
    }
}

// MARK: - Supporting Views

// Results view to display analysis conditions
struct ResultsView: View {
    let results: [AnalysisCondition]
    let analysisType: MLAnalysisService.AnalysisType
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Analysis Results")
                .font(.title2)
                .fontWeight(.bold)
                .padding(.horizontal)
            
            Text("We've analyzed your \(analysisType == .throat ? "throat" : "ear") image and identified the following potential conditions:")
                .font(.subheadline)
                .foregroundColor(.gray)
                .padding(.horizontal)
            
            ForEach(results) { condition in
                ConditionCardView(condition: condition)
            }
            
            DisclaimerView()
        }
    }
}

// Card view for each identified condition
struct ConditionCardView: View {
    let condition: AnalysisCondition
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(condition.name)
                    .font(.headline)
                
                Spacer()
                
                // Confidence badge
                Text("\(condition.confidencePercentage)%")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(condition.confidenceColor))
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
            
            Text(condition.description)
                .font(.body)
                .foregroundColor(.primary)
            
            Divider()
            
            HStack(alignment: .top) {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundColor(Color(condition.severity.color))
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Severity: \(condition.severity.displayName)")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(Color(condition.severity.color))
                    
                    Text(condition.recommendation)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        .padding(.horizontal)
    }
}

// Medical disclaimer
struct DisclaimerView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("IMPORTANT DISCLAIMER")
                .font(.headline)
                .foregroundColor(.red)
            
            Text("This analysis is not a medical diagnosis. The results are based on machine learning algorithms and should not replace professional medical advice. If you have health concerns, please consult a healthcare professional.")
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .cornerRadius(10)
        .padding()
    }
}

// Instructions card
struct InstructionCardView: View {
    let analysisType: MLAnalysisService.AnalysisType
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("How to get a good analysis")
                .font(.headline)
            
            VStack(alignment: .leading, spacing: 10) {
                InstructionRow(
                    icon: "lightbulb.fill",
                    text: "Use bright, natural lighting"
                )
                
                InstructionRow(
                    icon: "camera.fill",
                    text: "Hold the camera steady"
                )
                
                InstructionRow(
                    icon: "drop.fill",
                    text: "For throat: Use a flashlight and open mouth wide"
                )
                
                InstructionRow(
                    icon: "ear.fill",
                    text: "For ear: Gently pull ear up and back to straighten canal"
                )
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

struct InstructionRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 15) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .imageScale(.large)
            
            Text(text)
                .font(.subheadline)
        }
    }
}

// Placeholder for UIImagePickerController in a real app
struct ImagePickerView: View {
    @Binding var image: UIImage?
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        VStack {
            Text("Image Picker Placeholder")
                .font(.headline)
                .padding()
            
            Text("In a real app, this would be a UIImagePickerController")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .padding()
            
            Button("Select Sample Image") {
                // Create a simple colored rectangle as a placeholder image
                let renderer = UIGraphicsImageRenderer(size: CGSize(width: 300, height: 300))
                image = renderer.image { ctx in
                    UIColor.blue.setFill()
                    ctx.fill(CGRect(x: 0, y: 0, width: 300, height: 300))
                }
                
                presentationMode.wrappedValue.dismiss()
            }
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(10)
            .padding(.horizontal)
            
            Button("Cancel") {
                presentationMode.wrappedValue.dismiss()
            }
            .padding()
        }
    }
}

// Preview provider
struct AnalysisView_Previews: PreviewProvider {
    static var previews: some View {
        AnalysisView()
            .environmentObject(UserService.shared)
    }
}