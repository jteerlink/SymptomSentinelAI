import SwiftUI

struct EducationView: View {
    @EnvironmentObject var userService: UserService
    @State private var articles: [EducationalContent] = []
    @State private var filteredArticles: [EducationalContent] = []
    @State private var selectedCategory: EducationalContent.ContentCategory? = nil
    @State private var searchText: String = ""
    @State private var isLoading: Bool = true
    @State private var showPremiumContent: Bool = true
    @State private var selectedArticle: EducationalContent? = nil
    @State private var showDetailView: Bool = false
    
    var body: some View {
        NavigationView {
            VStack {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    
                    TextField("Search articles...", text: $searchText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .onChange(of: searchText) { _ in
                            filterArticles()
                        }
                    
                    if !searchText.isEmpty {
                        Button(action: {
                            searchText = ""
                            filterArticles()
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding(.horizontal)
                
                // Category filters
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        CategoryFilterButton(
                            title: "All",
                            isSelected: selectedCategory == nil,
                            action: {
                                selectedCategory = nil
                                filterArticles()
                            }
                        )
                        
                        ForEach(EducationalContent.ContentCategory.allCases, id: \.self) { category in
                            CategoryFilterButton(
                                title: category.rawValue,
                                isSelected: selectedCategory == category,
                                color: Color(category.displayColor),
                                action: {
                                    selectedCategory = category
                                    filterArticles()
                                }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)
                
                // Premium content toggle for free users
                if let user = userService.currentUser, user.subscriptionLevel == .free {
                    Toggle(isOn: $showPremiumContent) {
                        HStack {
                            Text("Show Premium Content")
                                .font(.subheadline)
                            
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 8)
                    .onChange(of: showPremiumContent) { _ in
                        filterArticles()
                    }
                }
                
                if isLoading {
                    Spacer()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .scaleEffect(1.5)
                    Spacer()
                } else if filteredArticles.isEmpty {
                    Spacer()
                    EmptyContentView(searchText: searchText)
                    Spacer()
                } else {
                    // Articles grid
                    ScrollView {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                            ForEach(filteredArticles) { article in
                                ArticleCardView(article: article)
                                    .onTapGesture {
                                        selectedArticle = article
                                        showDetailView = true
                                    }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Educational Resources")
            .sheet(isPresented: $showDetailView) {
                if let article = selectedArticle {
                    ArticleDetailSheet(article: article)
                }
            }
            .onAppear {
                loadArticles()
            }
        }
    }
    
    private func loadArticles() {
        // In a real app, this would fetch articles from an API
        // For now, load sample data with a simulated delay
        isLoading = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.articles = EducationDataProvider.allArticles
            self.filterArticles()
            self.isLoading = false
        }
    }
    
    private func filterArticles() {
        var filtered = articles
        
        // Filter by category if selected
        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }
        
        // Filter by search text
        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.title.localizedCaseInsensitiveContains(searchText) ||
                $0.summary.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        // Filter premium content for free users
        if let user = userService.currentUser, user.subscriptionLevel == .free && !showPremiumContent {
            filtered = filtered.filter { !$0.isPremiumContent }
        }
        
        filteredArticles = filtered
    }
}

// MARK: - Supporting Views

struct CategoryFilterButton: View {
    let title: String
    let isSelected: Bool
    var color: Color = .blue
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .bold : .regular)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? color.opacity(0.2) : Color.gray.opacity(0.1))
                .foregroundColor(isSelected ? color : .primary)
                .cornerRadius(8)
        }
    }
}

struct ArticleCardView: View {
    let article: EducationalContent
    
    var body: some View {
        VStack(alignment: .leading) {
            // Icon or image
            ZStack(alignment: .topTrailing) {
                Image(systemName: article.displayImageName)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(height: 80)
                    .padding()
                    .foregroundColor(Color(article.category.displayColor))
                
                if article.isPremiumContent {
                    Image(systemName: "star.fill")
                        .foregroundColor(.yellow)
                        .padding(6)
                        .background(Color.blue.opacity(0.7))
                        .clipShape(Circle())
                        .padding(6)
                }
            }
            
            VStack(alignment: .leading, spacing: 6) {
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
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(article.category.displayColor).opacity(0.2))
                        .foregroundColor(Color(article.category.displayColor))
                        .cornerRadius(4)
                    
                    Spacer()
                    
                    Text(article.formattedReadTime)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                .padding(.top, 4)
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 12)
        }
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

struct EmptyContentView: View {
    let searchText: String
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "doc.text.magnifyingglass")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 60, height: 60)
                .foregroundColor(.gray)
            
            if !searchText.isEmpty {
                Text("No results found for '\(searchText)'")
                    .font(.headline)
                
                Text("Try a different search term or browse by category")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            } else {
                Text("No articles available")
                    .font(.headline)
                
                Text("Check back later for new content")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
        }
        .padding()
    }
}

struct ArticleDetailSheet: View {
    let article: EducationalContent
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var userService: UserService
    @State private var showingPremiumAlert = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Header image
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: article.displayImageName)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(height: 180)
                            .padding()
                            .foregroundColor(Color(article.category.displayColor))
                        
                        if article.isPremiumContent {
                            HStack {
                                Image(systemName: "star.fill")
                                    .foregroundColor(.yellow)
                                
                                Text("Premium")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.blue)
                            .cornerRadius(16)
                            .padding(12)
                        }
                    }
                    
                    // Article metadata
                    HStack {
                        Text(article.category.rawValue)
                            .font(.subheadline)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Color(article.category.displayColor).opacity(0.2))
                            .foregroundColor(Color(article.category.displayColor))
                            .cornerRadius(6)
                        
                        Spacer()
                        
                        Text(article.formattedReadTime)
                            .font(.subheadline)
                            .foregroundColor(.gray)
                        
                        Text("•")
                            .foregroundColor(.gray)
                        
                        // Format date for display
                        Text(formattedDate(article.lastUpdated))
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    .padding(.horizontal)
                    
                    // Title and summary
                    Text(article.title)
                        .font(.title)
                        .fontWeight(.bold)
                        .padding(.horizontal)
                    
                    Text(article.summary)
                        .font(.headline)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                    
                    Divider()
                        .padding(.vertical, 8)
                    
                    // Premium content gate for free users
                    if article.isPremiumContent, let user = userService.currentUser, user.subscriptionLevel == .free {
                        premiumContentGateView
                    } else {
                        // Full article content
                        VStack(alignment: .leading, spacing: 16) {
                            ForEach(article.content, id: \.self) { paragraph in
                                Text(paragraph)
                                    .font(.body)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.bottom, 16)
            }
            .navigationBarTitle("", displayMode: .inline)
            .navigationBarItems(leading: 
                Button(action: {
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Image(systemName: "xmark")
                        .foregroundColor(.primary)
                        .padding(8)
                        .background(Color.gray.opacity(0.1))
                        .clipShape(Circle())
                }
            )
            .alert(isPresented: $showingPremiumAlert) {
                Alert(
                    title: Text("Premium Content"),
                    message: Text("Upgrade to Premium to access all educational resources."),
                    primaryButton: .default(Text("Learn More")) {
                        // Navigate to subscription page
                        presentationMode.wrappedValue.dismiss()
                        // In a real app, you would navigate to the subscription view
                    },
                    secondaryButton: .cancel()
                )
            }
        }
    }
    
    private var premiumContentGateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "lock.fill")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 50, height: 50)
                .foregroundColor(.yellow)
            
            Text("Premium Content")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("Upgrade to Premium to access this full article and our entire educational library.")
                .font(.body)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button(action: {
                showingPremiumAlert = true
            }) {
                Text("Upgrade to Premium")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.blue)
                    .cornerRadius(10)
            }
            .padding(.horizontal, 40)
            .padding(.top, 10)
        }
        .padding()
        .background(Color.blue.opacity(0.05))
        .cornerRadius(12)
        .padding()
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
}

// MARK: - Sample Data Provider

struct EducationDataProvider {
    static let allArticles: [EducationalContent] = [
        EducationalContent(
            id: "1",
            title: "Understanding Strep Throat",
            summary: "Learn about the common symptoms and treatments for strep throat infections.",
            category: .throat,
            readTime: 5,
            content: [
                "Strep throat is a bacterial infection caused by group A Streptococcus bacteria. It affects the throat and tonsils, causing symptoms like sore throat, difficulty swallowing, and fever.",
                "Common symptoms include throat pain that comes on quickly, pain when swallowing, red and swollen tonsils, tiny red spots on the roof of the mouth, swollen lymph nodes in the front of the neck, fever, headache, rash, nausea, and vomiting (especially in younger children).",
                "Unlike viral sore throats, strep throat requires treatment with antibiotics. If left untreated, strep throat can lead to complications such as kidney inflammation or rheumatic fever.",
                "If you suspect you have strep throat, it's important to see a doctor for proper diagnosis and treatment with antibiotics if necessary. Most people start feeling better within 24-48 hours after starting antibiotics."
            ],
            imageNames: ["waveform.path"],
            lastUpdated: Date().addingTimeInterval(-7 * 24 * 60 * 60), // 7 days ago
            isPremiumContent: false
        ),
        EducationalContent(
            id: "2",
            title: "Ear Infection Prevention",
            summary: "Tips to prevent ear infections in adults and children.",
            category: .ear,
            readTime: 4,
            content: [
                "Ear infections occur when bacteria or viruses affect the middle ear. They are more common in children but can affect adults as well.",
                "To prevent ear infections, practice good hygiene by washing hands frequently, especially during cold and flu season. Get vaccinated against influenza and pneumococcal disease as recommended.",
                "Avoid exposure to secondhand smoke, which can increase the risk of ear infections. If you swim regularly, wear earplugs or a swimming cap to keep water out of your ears, and dry your ears thoroughly after swimming or bathing.",
                "For children, breastfeeding for at least six months can provide antibodies that help prevent infections. When bottle-feeding, hold the infant in an upright position rather than letting them drink lying down."
            ],
            imageNames: ["ear"],
            lastUpdated: Date().addingTimeInterval(-14 * 24 * 60 * 60), // 14 days ago
            isPremiumContent: true
        ),
        EducationalContent(
            id: "3",
            title: "When to See a Doctor",
            summary: "Important signs that indicate you should consult a healthcare professional.",
            category: .treatment,
            readTime: 7,
            content: [
                "While many conditions can be managed at home, certain symptoms warrant prompt medical attention. For throat conditions, see a doctor if you experience severe throat pain, difficulty swallowing or breathing, unusual drooling (in children), a rash, or a fever above 101°F (38.3°C).",
                "For ear conditions, consult a healthcare provider if you have severe ear pain, discharge from the ear, hearing loss, dizziness, or symptoms that persist for more than 2-3 days.",
                "Always seek immediate medical care for any symptoms that are severe, concerning, or different from what you normally experience. This is particularly important for young children, elderly individuals, and those with compromised immune systems.",
                "Remember that early diagnosis and treatment often lead to better outcomes and can prevent complications from developing."
            ],
            imageNames: ["cross.case"],
            lastUpdated: Date().addingTimeInterval(-3 * 24 * 60 * 60), // 3 days ago
            isPremiumContent: false
        ),
        EducationalContent(
            id: "4",
            title: "Recognizing Tonsillitis",
            summary: "How to identify tonsillitis and when home care is sufficient.",
            category: .throat,
            readTime: 6,
            content: [
                "Tonsillitis is inflammation of the tonsils, typically caused by viral or bacterial infections. The primary symptoms include sore throat, red and swollen tonsils, difficulty swallowing, tender lymph nodes on the sides of the neck, and fever.",
                "You may also notice white or yellow patches on the tonsils, bad breath, stiff neck, headache, and in young children, increased irritability and drooling due to painful swallowing.",
                "Most cases of tonsillitis are caused by viruses and will resolve on their own within 7-10 days. Home care includes rest, plenty of fluids, gargling with warm salt water, throat lozenges (for older children and adults), and over-the-counter pain relievers.",
                "If symptoms are severe, persist longer than 3-4 days, or include difficulty breathing or extreme difficulty swallowing, seek medical attention promptly. Bacterial tonsillitis may require antibiotic treatment."
            ],
            imageNames: ["waveform.path"],
            lastUpdated: Date().addingTimeInterval(-21 * 24 * 60 * 60), // 21 days ago
            isPremiumContent: true
        ),
        EducationalContent(
            id: "5",
            title: "Swimmer's Ear Treatment",
            summary: "How to treat and prevent swimmer's ear infections.",
            category: .ear,
            readTime: 5,
            content: [
                "Swimmer's ear (otitis externa) is an infection of the outer ear canal often caused by water remaining in the ear after swimming, creating a moist environment where bacteria can grow.",
                "Symptoms include itching in the ear canal, redness, discomfort that worsens when pulling on the outer ear, drainage, and sometimes decreased hearing. In severe cases, the ear canal may swell shut, causing significant pain and complete hearing loss.",
                "Treatment typically involves careful cleaning of the ear by a healthcare professional, followed by antibiotic ear drops. Over-the-counter pain relievers can help manage discomfort.",
                "To prevent swimmer's ear, keep ears dry when swimming by using earplugs or a swim cap. After swimming, tilt your head to drain water from each ear, and consider using a hairdryer on the lowest setting to dry the ear canal."
            ],
            imageNames: ["ear"],
            lastUpdated: Date().addingTimeInterval(-5 * 24 * 60 * 60), // 5 days ago
            isPremiumContent: false
        ),
        EducationalContent(
            id: "6",
            title: "Maintaining Throat Health",
            summary: "Preventive measures to keep your throat healthy year-round.",
            category: .prevention,
            readTime: 4,
            content: [
                "Maintaining good throat health involves several preventive practices. Stay hydrated by drinking plenty of water throughout the day to keep your throat moist and help thin mucus secretions.",
                "Practice good hygiene by washing hands frequently, especially before eating and after being in public places. Avoid sharing food, drinks, and personal items like toothbrushes to prevent the spread of throat infections.",
                "Humidify your home, especially in dry winter months, to prevent throat irritation. Avoid irritants such as smoking, secondhand smoke, and chemical fumes which can cause throat inflammation.",
                "Manage allergies and acid reflux, which can contribute to chronic throat irritation. And finally, give your voice a rest if you use it extensively for work or hobbies."
            ],
            imageNames: ["heart.text.square"],
            lastUpdated: Date().addingTimeInterval(-10 * 24 * 60 * 60), // 10 days ago
            isPremiumContent: true
        )
    ]
}