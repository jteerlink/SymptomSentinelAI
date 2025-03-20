import SwiftUI

struct HomeView: View {
    @EnvironmentObject var userService: UserService
    @State private var showingAnalysisOptions = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Welcome section
                    HStack(spacing: 15) {
                        Image(systemName: "person.circle.fill")
                            .resizable()
                            .frame(width: 60, height: 60)
                            .foregroundColor(.blue)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Welcome back,")
                                .font(.headline)
                                .foregroundColor(.gray)
                            
                            Text(userService.currentUser?.name ?? "User")
                                .font(.title)
                                .fontWeight(.bold)
                        }
                        
                        Spacer()
                        
                        if let user = userService.currentUser, user.subscriptionLevel == .premium {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                                .padding(8)
                                .background(Color.blue.opacity(0.15))
                                .clipShape(Circle())
                        }
                    }
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(12)
                    
                    // Quick analysis buttons
                    VStack(alignment: .leading, spacing: 15) {
                        Text("Quick Analysis")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Button(action: { showingAnalysisOptions = true }) {
                            HStack {
                                Image(systemName: "camera.fill")
                                    .foregroundColor(.white)
                                    .padding(12)
                                    .background(Color.blue)
                                    .clipShape(Circle())
                                
                                Text("Start New Analysis")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                Spacer()
                                
                                Image(systemName: "chevron.right")
                                    .foregroundColor(.gray)
                            }
                            .padding()
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(12)
                        }
                        
                        // Remaining analysis count for free users
                        if let user = userService.currentUser, user.subscriptionLevel == .free {
                            HStack {
                                Text("Analyses remaining this month: \(user.analysesRemainingThisMonth())")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                                
                                Spacer()
                                
                                NavigationLink(destination: SubscriptionView()) {
                                    Text("Upgrade")
                                        .font(.subheadline)
                                        .foregroundColor(.blue)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding()
                    
                    // Recent analyses section
                    VStack(alignment: .leading, spacing: 15) {
                        HStack {
                            Text("Recent Analyses")
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            Spacer()
                            
                            NavigationLink(destination: HistoryView()) {
                                Text("View All")
                                    .font(.subheadline)
                                    .foregroundColor(.blue)
                            }
                        }
                        
                        if let user = userService.currentUser, !user.analysisHistory.isEmpty {
                            ForEach(user.analysisHistory.prefix(3)) { analysis in
                                AnalysisHistoryCard(analysis: analysis)
                            }
                        } else {
                            EmptyAnalysisView()
                        }
                    }
                    .padding()
                    
                    // Educational content preview
                    VStack(alignment: .leading, spacing: 15) {
                        HStack {
                            Text("Educational Resources")
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            Spacer()
                            
                            NavigationLink(destination: EducationView()) {
                                Text("View All")
                                    .font(.subheadline)
                                    .foregroundColor(.blue)
                            }
                        }
                        
                        // Featured article cards
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 15) {
                                ForEach(SampleData.featuredArticles) { article in
                                    EducationalArticleCard(article: article)
                                }
                            }
                        }
                    }
                    .padding()
                }
                .padding(.vertical)
            }
            .navigationTitle("Home")
            .actionSheet(isPresented: $showingAnalysisOptions) {
                ActionSheet(
                    title: Text("New Analysis"),
                    message: Text("Choose the type of analysis you want to perform"),
                    buttons: [
                        .default(Text("Throat Analysis")) {
                            // Navigate to analysis view with type throat
                            // In a real app, this would use a navigation link or state change
                        },
                        .default(Text("Ear Analysis")) {
                            // Navigate to analysis view with type ear
                        },
                        .cancel()
                    ]
                )
            }
        }
    }
}

// History card view
struct AnalysisHistoryCard: View {
    let analysis: User.AnalysisRecord
    
    var body: some View {
        NavigationLink(destination: AnalysisDetailView(analysis: analysis)) {
            HStack {
                // Type icon
                Image(systemName: analysis.type.iconName)
                    .foregroundColor(.white)
                    .padding(10)
                    .background(Color.blue)
                    .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(analysis.type.displayName)
                        .font(.headline)
                    
                    if let topCondition = analysis.topCondition {
                        Text(topCondition.name)
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    
                    Text(analysis.formattedDate)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.gray)
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// Educational article card
struct EducationalArticleCard: View {
    let article: EducationalContent
    
    var body: some View {
        NavigationLink(destination: ArticleDetailView(article: article)) {
            VStack(alignment: .leading) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: article.displayImageName)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(height: 120)
                        .padding()
                        .foregroundColor(Color(article.category.displayColor))
                    
                    if article.isPremiumContent {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                            .padding(8)
                            .background(Color.blue.opacity(0.7))
                            .clipShape(Circle())
                            .padding(8)
                    }
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text(article.title)
                        .font(.headline)
                        .foregroundColor(.primary)
                        .lineLimit(2)
                    
                    Text(article.summary)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .lineLimit(2)
                    
                    HStack {
                        Text(article.category.rawValue)
                            .font(.caption)
                            .foregroundColor(.white)
                            .padding(.horizontal,.10)
                            .padding(.vertical, 4)
                            .background(Color(article.category.displayColor))
                            .cornerRadius(4)
                        
                        Spacer()
                        
                        Text(article.formattedReadTime)
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
                .padding()
            }
            .frame(width: 250)
            .background(Color.white)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// Empty analysis view
struct EmptyAnalysisView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "doc.text.magnifyingglass")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 60, height: 60)
                .foregroundColor(.gray)
            
            Text("No analyses yet")
                .font(.headline)
            
            Text("Start your first analysis to see your results here")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

// Sample data for preview
struct SampleData {
    static let featuredArticles = [
        EducationalContent(
            id: "1",
            title: "Understanding Strep Throat",
            summary: "Learn about the common symptoms and treatments for strep throat infections.",
            category: .throat,
            readTime: 5,
            content: ["Strep throat is a bacterial infection caused by group A Streptococcus bacteria. It affects the throat and tonsils, causing symptoms like sore throat, difficulty swallowing, and fever."],
            imageNames: ["waveform.path"],
            lastUpdated: Date(),
            isPremiumContent: false
        ),
        EducationalContent(
            id: "2",
            title: "Ear Infection Prevention",
            summary: "Tips to prevent ear infections in adults and children.",
            category: .ear,
            readTime: 4,
            content: ["Ear infections often occur when bacteria or viruses affect the middle ear. This article covers prevention strategies to keep your ears healthy."],
            imageNames: ["ear"],
            lastUpdated: Date(),
            isPremiumContent: true
        ),
        EducationalContent(
            id: "3",
            title: "When to See a Doctor",
            summary: "Important signs that indicate you should consult a healthcare professional.",
            category: .treatment,
            readTime: 7,
            content: ["While many conditions can be managed at home, some symptoms warrant professional medical attention. Learn the warning signs to look for."],
            imageNames: ["cross.case"],
            lastUpdated: Date(),
            isPremiumContent: false
        )
    ]
}

// Placeholder views for navigation destinations
struct HistoryView: View {
    var body: some View {
        Text("History View Placeholder")
            .navigationTitle("Analysis History")
    }
}

struct AnalysisDetailView: View {
    let analysis: User.AnalysisRecord
    
    var body: some View {
        Text("Analysis Detail Placeholder")
            .navigationTitle(analysis.type.displayName)
    }
}

struct ArticleDetailView: View {
    let article: EducationalContent
    
    var body: some View {
        Text("Article Detail Placeholder")
            .navigationTitle(article.title)
    }
}

// Preview provider
struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        HomeView()
            .environmentObject(UserService.shared)
    }
}