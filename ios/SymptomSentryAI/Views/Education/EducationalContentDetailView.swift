import SwiftUI
import AVKit
import WebKit

/// Detail view for educational content
struct EducationalContentDetailView: View {
    // MARK: - Properties
    
    /// Content to display
    let content: EducationalContent
    
    /// Education service
    @ObservedObject private var educationService = EducationService.shared
    
    /// Environment dismiss
    @Environment(\.dismiss) private var dismiss
    
    /// State for fullscreen video
    @State private var isVideoFullscreen = false
    
    /// State for whether content is saved
    @State private var isSaved: Bool
    
    /// State for share sheet
    @State private var isShareSheetPresented = false
    
    /// State for font size
    @State private var fontSize: FontSize = .medium
    
    // MARK: - Initialization
    
    init(content: EducationalContent) {
        self.content = content
        self._isSaved = State(initialValue: EducationService.shared.isSaved(contentID: content.id))
    }
    
    // MARK: - Font size enum
    
    enum FontSize: String, CaseIterable, Identifiable {
        case small = "Small"
        case medium = "Medium"
        case large = "Large"
        
        var id: String { rawValue }
        
        var textSize: CGFloat {
            switch self {
            case .small: return 14
            case .medium: return 17
            case .large: return 21
            }
        }
        
        var headingSize: CGFloat {
            switch self {
            case .small: return 18
            case .medium: return 22
            case .large: return 28
            }
        }
        
        var icon: String {
            switch self {
            case .small: return "textformat.size.smaller"
            case .medium: return "textformat"
            case .large: return "textformat.size.larger"
            }
        }
    }
    
    // MARK: - Body
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Header section
                VStack(alignment: .leading, spacing: 12) {
                    // Title
                    Text(content.title)
                        .font(.system(size: fontSize.headingSize))
                        .fontWeight(.bold)
                        .padding(.top)
                    
                    // Metadata row
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            // Author and date
                            HStack {
                                Text(content.author)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                Text("•")
                                    .foregroundColor(.gray)
                                
                                Text(content.formattedDate)
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                            
                            // Reading time or duration
                            HStack {
                                if let readingTime = content.readingTimeMinutes {
                                    Label("\(readingTime) min read", systemImage: "clock")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                } else if let duration = content.formattedDuration {
                                    Label(duration, systemImage: "clock")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                                
                                if content.isPremiumOnly {
                                    Badge(
                                        text: "Premium",
                                        color: .yellow,
                                        icon: "crown"
                                    )
                                }
                            }
                        }
                        
                        Spacer()
                        
                        // Level indicator
                        Badge(
                            text: content.level.rawValue,
                            color: content.level.color
                        )
                    }
                    
                    // Tags
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
                    
                    Divider()
                }
                .padding(.horizontal)
                
                // Media content (if applicable)
                if content.type == .video, let mediaURLString = content.mediaURL, let url = URL(string: mediaURLString) {
                    VideoPlayer(player: AVPlayer(url: url))
                        .frame(height: 230)
                        .cornerRadius(12)
                        .shadow(radius: 4)
                        .padding(.horizontal)
                } else if content.type == .infographic, let mediaURLString = content.mediaURL, let url = URL(string: mediaURLString) {
                    // Infographic image
                    AsyncImage(url: URL(string: mediaURLString)) { phase in
                        if let image = phase.image {
                            image
                                .resizable()
                                .scaledToFit()
                                .cornerRadius(12)
                        } else if phase.error != nil {
                            Text("Failed to load image")
                                .foregroundColor(.red)
                        } else {
                            ProgressView()
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal)
                }
                
                // Article content
                MarkdownContentView(markdown: content.content, fontSize: fontSize)
                    .padding(.horizontal)
                    .padding(.bottom, 20)
            }
        }
        .onAppear {
            // Mark as viewed when appearing
            educationService.markAsViewed(contentID: content.id)
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: 16) {
                    // Font size button
                    Menu {
                        ForEach(FontSize.allCases) { size in
                            Button(action: {
                                fontSize = size
                            }) {
                                HStack {
                                    Text(size.rawValue)
                                    if fontSize == size {
                                        Image(systemName: "checkmark")
                                    }
                                }
                            }
                        }
                    } label: {
                        Image(systemName: fontSize.icon)
                    }
                    
                    // Share button
                    Button(action: {
                        isShareSheetPresented = true
                    }) {
                        Image(systemName: "square.and.arrow.up")
                    }
                    .sheet(isPresented: $isShareSheetPresented) {
                        ShareSheet(activityItems: [content.title, content.description])
                    }
                    
                    // Save button
                    Button(action: {
                        educationService.toggleSaved(contentID: content.id)
                        isSaved.toggle()
                    }) {
                        Image(systemName: isSaved ? "bookmark.fill" : "bookmark")
                    }
                    .accessibilityIdentifier("saveContentButton")
                }
            }
        }
    }
}

/// View that renders Markdown content
struct MarkdownContentView: View {
    let markdown: String
    let fontSize: EducationalContentDetailView.FontSize
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // In a real app, use a proper Markdown renderer
            // This is a simplified version for demo purposes
            ForEach(markdownSections, id: \.self) { section in
                if section.starts(with: "# ") {
                    Text(section.replacingOccurrences(of: "# ", with: ""))
                        .font(.system(size: fontSize.headingSize))
                        .fontWeight(.bold)
                        .padding(.top, 8)
                        .padding(.bottom, 4)
                } else if section.starts(with: "## ") {
                    Text(section.replacingOccurrences(of: "## ", with: ""))
                        .font(.system(size: fontSize.headingSize - 4))
                        .fontWeight(.semibold)
                        .padding(.top, 6)
                        .padding(.bottom, 2)
                } else if section.starts(with: "- ") {
                    HStack(alignment: .top, spacing: 8) {
                        Text("•")
                            .fontWeight(.bold)
                        Text(section.replacingOccurrences(of: "- ", with: ""))
                            .font(.system(size: fontSize.textSize))
                    }
                    .padding(.leading, 4)
                } else {
                    Text(section)
                        .font(.system(size: fontSize.textSize))
                        .lineSpacing(4)
                        .padding(.vertical, 2)
                }
            }
        }
    }
    
    private var markdownSections: [String] {
        markdown.components(separatedBy: "\n\n").filter { !$0.isEmpty }
    }
}

/// Share sheet using UIActivityViewController
struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    let applicationActivities: [UIActivity]? = nil
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(
            activityItems: activityItems,
            applicationActivities: applicationActivities
        )
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

/// Preview
struct EducationalContentDetailView_Previews: PreviewProvider {
    static var previews: some View {
        EducationalContentDetailView(content: EducationalContent.sampleContent()[0])
    }
}