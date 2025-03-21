import SwiftUI
import Combine

/**
 * AnalysisHistoryView
 *
 * This view displays the user's history of image analyses.
 * It shows a list of past analyses with the ability to:
 * - View details of a past analysis
 * - Delete analyses from history
 * - Filter analyses by type
 */
struct AnalysisHistoryView: View {
    // MARK: - Properties
    
    // Services
    @StateObject private var analysisService = AnalysisService.shared
    
    // UI State
    @State private var selectedFilter: MLAnalysisService.AnalysisType?
    @State private var showingDeleteConfirmation = false
    @State private var analysisToDelete: AnalysisResponse?
    
    // MARK: - Body
    
    var body: some View {
        VStack(spacing: 0) {
            // Filter options
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    FilterChip(
                        title: "All",
                        isSelected: selectedFilter == nil,
                        action: { selectedFilter = nil }
                    )
                    
                    ForEach(MLAnalysisService.AnalysisType.allCases) { type in
                        FilterChip(
                            title: type.displayName,
                            isSelected: selectedFilter == type,
                            action: { selectedFilter = type }
                        )
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
            }
            .background(Color(UIColor.systemBackground))
            
            // Analysis list
            if analysisService.isLoading {
                VStack {
                    ProgressView()
                        .padding()
                    Text("Loading your analysis history...")
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let errorMessage = analysisService.errorMessage {
                VStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text("Failed to load analysis history")
                        .font(.headline)
                    Text(errorMessage)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if filteredAnalyses.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.system(size: 50))
                        .foregroundColor(.secondary)
                        .padding(.bottom)
                    
                    Text("No analyses found")
                        .font(.headline)
                    
                    Text(selectedFilter == nil 
                         ? "You haven't performed any analyses yet."
                         : "You haven't performed any \(selectedFilter!.displayName.lowercased()) analyses yet.")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List {
                    ForEach(filteredAnalyses, id: \.id) { analysis in
                        NavigationLink(destination: AnalysisDetailView(analysis: analysis)) {
                            AnalysisHistoryRow(analysis: analysis)
                        }
                        .swipeActions {
                            Button(role: .destructive) {
                                analysisToDelete = analysis
                                showingDeleteConfirmation = true
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
                .listStyle(InsetGroupedListStyle())
                .refreshable {
                    analysisService.refreshAnalyses()
                }
            }
        }
        .navigationTitle("Analysis History")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                if !filteredAnalyses.isEmpty {
                    Menu {
                        Button(action: {
                            // Show confirmation for delete all
                        }) {
                            Label("Delete All", systemImage: "trash")
                        }
                        
                        Button(action: {
                            analysisService.refreshAnalyses()
                        }) {
                            Label("Refresh", systemImage: "arrow.clockwise")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
        .alert("Delete Analysis", isPresented: $showingDeleteConfirmation) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                if let analysis = analysisToDelete {
                    deleteAnalysis(analysis)
                }
            }
        } message: {
            Text("Are you sure you want to delete this analysis? This action cannot be undone.")
        }
        .onAppear {
            // Refresh analyses when the view appears
            analysisService.refreshAnalyses()
        }
    }
    
    // MARK: - Computed Properties
    
    /// Returns filtered analyses based on the selected filter
    private var filteredAnalyses: [AnalysisResponse] {
        if let filter = selectedFilter {
            return analysisService.getAnalyses(forType: filter)
        } else {
            return analysisService.savedAnalyses
        }
    }
    
    // MARK: - Methods
    
    /// Delete an analysis from history
    private func deleteAnalysis(_ analysis: AnalysisResponse) {
        let _ = analysisService.deleteAnalysis(id: analysis.id)
    }
}

// MARK: - Supporting Views

/// Filter chip for filtering analyses
struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    Capsule()
                        .fill(isSelected ? Color.blue : Color(UIColor.systemGray5))
                )
                .foregroundColor(isSelected ? .white : .primary)
        }
    }
}

/// Row view for an analysis in the history list
struct AnalysisHistoryRow: View {
    let analysis: AnalysisResponse
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(analysis.type.capitalized)
                    .font(.headline)
                
                Spacer()
                
                Text(analysis.formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if !analysis.conditions.isEmpty {
                Text("Top finding: \(analysis.conditions[0].name)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                // Badge showing confidence
                HStack(spacing: 4) {
                    Image(systemName: "percent")
                        .font(.caption)
                    
                    Text(analysis.conditions[0].confidencePercentage)
                        .font(.caption)
                        .fontWeight(.semibold)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(analysis.conditions[0].confidenceBadgeColor).opacity(0.2))
                )
                .foregroundColor(Color(analysis.conditions[0].confidenceBadgeColor))
            }
        }
        .padding(.vertical, 4)
    }
}

/// Detail view for a saved analysis
struct AnalysisDetailView: View {
    let analysis: AnalysisResponse
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Analysis metadata
                VStack(spacing: 8) {
                    Text(analysis.type.capitalized)
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Analyzed on \(analysis.formattedDate)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()
                
                Divider()
                
                // Disclaimer
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "exclamationmark.triangle")
                        .foregroundColor(.orange)
                    
                    Text("This analysis is for informational purposes only and does not constitute medical advice. Please consult with a healthcare professional for proper diagnosis.")
                        .font(.footnote)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal)
                
                // Conditions
                ForEach(analysis.conditions) { condition in
                    ConditionDetailView(condition: condition)
                }
                
                Spacer(minLength: 40)
            }
        }
        .navigationTitle("Analysis Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// Detail view for a condition
struct ConditionDetailView: View {
    let condition: AnalysisCondition
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(condition.name)
                    .font(.headline)
                
                Spacer()
                
                Text("Confidence: \(condition.confidencePercentage)")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color(condition.confidenceBadgeColor).opacity(0.2))
                    )
                    .foregroundColor(Color(condition.confidenceBadgeColor))
            }
            
            Text(condition.description)
                .font(.body)
                .foregroundColor(.secondary)
            
            if !condition.symptoms.isEmpty {
                Text("Common Symptoms")
                    .font(.headline)
                    .foregroundColor(.primary)
                    .padding(.top, 4)
                
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
            
            if condition.isPotentiallySerious {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundColor(.red)
                    
                    Text("This condition may require medical attention.")
                        .font(.callout)
                        .foregroundColor(.red)
                }
                .padding(.top, 8)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(UIColor.secondarySystemBackground))
        )
        .padding(.horizontal)
    }
}

struct AnalysisHistoryView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            AnalysisHistoryView()
        }
    }
}