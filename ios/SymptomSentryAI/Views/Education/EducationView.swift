import SwiftUI
import AVKit

/// Main view for educational content
struct EducationView: View {
    // MARK: - Environment & State
    
    /// Education service
    @ObservedObject private var educationService = EducationService.shared
    
    /// State for search text
    @State private var searchText = ""
    
    /// State for selected category
    @State private var selectedCategory: ContentCategory = .all
    
    /// State for showing filter sheet
    @State private var showingFilterSheet = false
    
    /// State for showing saved content only
    @State private var showingSavedOnly = false
    
    /// State for currently active filter
    @State private var activeFilter: ActiveFilter = .all
    
    /// State for showingDetailView
    @State private var selectedContent: EducationalContent?
    
    // Active filter options
    enum ActiveFilter {
        case all
        case featured
        case articles
        case videos
        case saved
        case premium
    }
    
    // MARK: - Computed Properties
    
    /// Filtered content based on search, category, and active filter
    private var filteredContent: [EducationalContent] {
        var content: [EducationalContent]
        
        // First apply the active filter
        switch activeFilter {
        case .all:
            content = educationService.getContent(for: selectedCategory, searchTerm: searchText)
        case .featured:
            content = educationService.getFeaturedContent()
                .filter { selectedCategory == .all || $0.category == selectedCategory }
                .filter { searchText.isEmpty || $0.title.lowercased().contains(searchText.lowercased()) }
        case .articles:
            content = educationService.getContent(ofType: .article)
                .filter { selectedCategory == .all || $0.category == selectedCategory }
                .filter { searchText.isEmpty || $0.title.lowercased().contains(searchText.lowercased()) }
        case .videos:
            content = educationService.getContent(ofType: .video)
                .filter { selectedCategory == .all || $0.category == selectedCategory }
                .filter { searchText.isEmpty || $0.title.lowercased().contains(searchText.lowercased()) }
        case .saved:
            content = educationService.getSavedContent()
                .filter { selectedCategory == .all || $0.category == selectedCategory }
                .filter { searchText.isEmpty || $0.title.lowercased().contains(searchText.lowercased()) }
        case .premium:
            content = educationService.getPremiumContent()
                .filter { selectedCategory == .all || $0.category == selectedCategory }
                .filter { searchText.isEmpty || $0.title.lowercased().contains(searchText.lowercased()) }
        }
        
        // Apply saved filter if needed
        if showingSavedOnly {
            content = content.filter { educationService.isSaved(contentID: $0.id) }
        }
        
        return content
    }
    
    // MARK: - Body
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search bar
                SearchBar(text: $searchText, placeholder: "Search educational content...")
                    .padding(.horizontal)
                    .padding(.top, 8)
                    .padding(.bottom, 4)
                    .accessibilityIdentifier("educationSearchBar")
                
                // Category picker
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(ContentCategory.allCases) { category in
                            Button(action: {
                                selectedCategory = category
                            }) {
                                VStack(spacing: 6) {
                                    ZStack {
                                        Circle()
                                            .fill(category == selectedCategory ? category.color : Color.gray.opacity(0.1))
                                            .frame(width: 44, height: 44)
                                        
                                        Image(systemName: category.iconName)
                                            .font(.system(size: 20))
                                            .foregroundColor(category == selectedCategory ? .white : category.color)
                                    }
                                    
                                    Text(category.rawValue)
                                        .font(.caption)
                                        .foregroundColor(category == selectedCategory ? .primary : .secondary)
                                }
                            }
                            .accessibilityIdentifier("category\(category.rawValue)")
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }
                
                // Filter bar
                HStack {
                    Text("\(filteredContent.count) results")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    // Filter button
                    Button(action: {
                        showingFilterSheet = true
                    }) {
                        HStack {
                            Image(systemName: "line.3.horizontal.decrease.circle")
                            Text("Filter")
                        }
                        .foregroundColor(.blue)
                    }
                    .accessibilityIdentifier("filterButton")
                }
                .padding(.horizontal)
                .padding(.bottom, 4)
                
                // Content list/grid
                ScrollView {
                    if activeFilter == .featured {
                        // Featured content carousel
                        FeaturedContentCarousel(
                            content: filteredContent,
                            onTap: { selectedContent = $0 },
                            onSaveToggle: { educationService.toggleSaved(contentID: $0) }
                        )
                    } else {
                        // Regular content list
                        LazyVStack(spacing: 16) {
                            ForEach(filteredContent) { content in
                                ContentCardView(
                                    content: content,
                                    isSaved: educationService.isSaved(contentID: content.id),
                                    onSaveToggle: {
                                        educationService.toggleSaved(contentID: content.id)
                                    }
                                )
                                .onTapGesture {
                                    self.selectedContent = content
                                }
                            }
                        }
                        .padding()
                    }
                }
                .sheet(isPresented: $showingFilterSheet) {
                    FilterView(
                        activeFilter: $activeFilter,
                        showingSavedOnly: $showingSavedOnly
                    )
                }
                .sheet(item: $selectedContent) { content in
                    EducationalContentDetailView(content: content)
                }
            }
            .navigationTitle("Education")
            .navigationBarItems(
                trailing: Button(action: {
                    withAnimation {
                        showingSavedOnly.toggle()
                    }
                }) {
                    Image(systemName: showingSavedOnly ? "bookmark.fill" : "bookmark")
                        .accessibilityLabel(showingSavedOnly ? "Show all content" : "Show saved content only")
                }
                .accessibilityIdentifier("savedToggleButton")
            )
        }
    }
}

/// Search bar component
struct SearchBar: View {
    @Binding var text: String
    var placeholder: String
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)
            
            TextField(placeholder, text: $text)
                .disableAutocorrection(true)
            
            if !text.isEmpty {
                Button(action: {
                    text = ""
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(8)
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

/// Filter view shown in a sheet
struct FilterView: View {
    @Binding var activeFilter: EducationView.ActiveFilter
    @Binding var showingSavedOnly: Bool
    @Environment(\.dismiss) var dismiss
    
    let filterOptions: [(filter: EducationView.ActiveFilter, name: String, icon: String)] = [
        (.all, "All Content", "square.grid.2x2"),
        (.featured, "Featured", "star"),
        (.articles, "Articles", "doc.text"),
        (.videos, "Videos", "play.rectangle"),
        (.saved, "Saved", "bookmark"),
        (.premium, "Premium", "crown")
    ]
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("Content Type")) {
                    ForEach(filterOptions, id: \.name) { option in
                        Button(action: {
                            activeFilter = option.filter
                            dismiss()
                        }) {
                            HStack {
                                Image(systemName: option.icon)
                                    .frame(width: 24)
                                Text(option.name)
                                Spacer()
                                if activeFilter == option.filter {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                }
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                
                Section(header: Text("Other Options")) {
                    Toggle("Show Saved Only", isOn: $showingSavedOnly)
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("Filter")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

/// Card view for individual content
struct ContentCardView: View {
    /// Content to display
    let content: EducationalContent
    
    /// Whether content is saved
    let isSaved: Bool
    
    /// Action when save button is tapped
    let onSaveToggle: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Content type and category badges + Save button
            HStack {
                // Type badge
                Badge(
                    text: content.type.rawValue.capitalized,
                    color: badgeColor(for: content.type)
                )
                
                // Category badge
                Badge(
                    text: content.category.rawValue,
                    color: content.category.color
                )
                
                Spacer()
                
                // Premium badge if applicable
                if content.isPremiumOnly {
                    Badge(
                        text: "Premium",
                        color: .yellow,
                        icon: "crown"
                    )
                }
                
                // Save button
                Button(action: onSaveToggle) {
                    Image(systemName: isSaved ? "bookmark.fill" : "bookmark")
                        .foregroundColor(isSaved ? .blue : .gray)
                }
                .accessibilityIdentifier("saveButton\(content.id)")
            }
            
            // Content thumbnail and title
            HStack(alignment: .top, spacing: 12) {
                // Thumbnail
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.gray.opacity(0.2))
                    
                    // Play button overlay for videos
                    if content.type == .video {
                        Image(systemName: "play.fill")
                            .font(.title)
                            .foregroundColor(.white)
                            .padding(10)
                            .background(Circle().fill(Color.black.opacity(0.6)))
                    }
                }
                .frame(width: 80, height: 80)
                
                VStack(alignment: .leading, spacing: 4) {
                    // Title
                    Text(content.title)
                        .font(.headline)
                        .lineLimit(2)
                    
                    // Description
                    Text(content.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                    
                    // Metadata row
                    HStack {
                        // Author
                        Text(content.author)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        // Reading time or duration
                        if let readingTime = content.readingTimeMinutes {
                            Label("\(readingTime) min read", systemImage: "clock")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        } else if let duration = content.formattedDuration {
                            Label(duration, systemImage: "clock")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            
            // Tags
            if !content.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        ForEach(content.tags, id: \.self) { tag in
                            Text(tag)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(12)
                        }
                    }
                }
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
    
    /// Returns appropriate badge color for content type
    private func badgeColor(for type: ContentType) -> Color {
        switch type {
        case .article:
            return .blue
        case .video:
            return .red
        case .infographic:
            return .purple
        }
    }
}

/// Badge component
struct Badge: View {
    let text: String
    let color: Color
    var icon: String?
    
    var body: some View {
        HStack(spacing: 4) {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.caption2)
            }
            
            Text(text)
                .font(.caption2)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(color.opacity(0.15))
        .foregroundColor(color)
        .cornerRadius(8)
    }
}

/// Carousel for featured content
struct FeaturedContentCarousel: View {
    let content: [EducationalContent]
    let onTap: (EducationalContent) -> Void
    let onSaveToggle: (String) -> Void
    
    var body: some View {
        VStack(alignment: .leading) {
            Text("Featured Content")
                .font(.headline)
                .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(content) { item in
                        FeaturedContentCard(
                            content: item,
                            isSaved: EducationService.shared.isSaved(contentID: item.id),
                            onTap: { onTap(item) },
                            onSaveToggle: { onSaveToggle(item.id) }
                        )
                        .frame(width: 300, height: 200)
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
    }
}

/// Card for featured content in carousel
struct FeaturedContentCard: View {
    let content: EducationalContent
    let isSaved: Bool
    let onTap: () -> Void
    let onSaveToggle: () -> Void
    
    var body: some View {
        ZStack(alignment: .bottomLeading) {
            // Background color/image
            RoundedRectangle(cornerRadius: 16)
                .fill(content.category.color.opacity(0.2))
            
            // Gradient overlay
            LinearGradient(
                gradient: Gradient(colors: [
                    .black.opacity(0.7),
                    .black.opacity(0.3),
                    .clear
                ]),
                startPoint: .bottom,
                endPoint: .top
            )
            .cornerRadius(16)
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                Spacer()
                
                // Badges
                HStack {
                    Badge(
                        text: content.type.rawValue.capitalized,
                        color: .white
                    )
                    
                    Badge(
                        text: content.category.rawValue,
                        color: content.category.color
                    )
                    
                    if content.isPremiumOnly {
                        Badge(
                            text: "Premium",
                            color: .yellow,
                            icon: "crown"
                        )
                    }
                    
                    Spacer()
                    
                    // Save button
                    Button(action: onSaveToggle) {
                        Image(systemName: isSaved ? "bookmark.fill" : "bookmark")
                            .foregroundColor(isSaved ? .yellow : .white)
                            .padding(8)
                            .background(Circle().fill(Color.black.opacity(0.5)))
                    }
                }
                
                // Title
                Text(content.title)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                // Description
                Text(content.description)
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.9))
                    .lineLimit(2)
                
                // Metadata
                HStack {
                    Text(content.author)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                    
                    Spacer()
                    
                    if content.type == .article, let time = content.readingTimeMinutes {
                        Label("\(time) min read", systemImage: "clock")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    } else if let duration = content.formattedDuration {
                        Label(duration, systemImage: "clock")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
                .padding(.top, 4)
            }
            .padding()
        }
        .onTapGesture(perform: onTap)
        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
    }
}

/// Preview
struct EducationView_Previews: PreviewProvider {
    static var previews: some View {
        EducationView()
    }
}