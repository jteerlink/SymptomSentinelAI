import Foundation
import SwiftUI

/// Educational content types
enum ContentType: String, Codable {
    case article = "article"
    case video = "video"
    case infographic = "infographic"
}

/// Content categories for filtering
enum ContentCategory: String, Codable, CaseIterable, Identifiable {
    case all = "All"
    case throat = "Throat"
    case ear = "Ear"
    case general = "General"
    case prevention = "Prevention"
    case treatment = "Treatment"
    
    var id: String { self.rawValue }
    
    /// Image for category
    var iconName: String {
        switch self {
        case .all: return "square.grid.2x2"
        case .throat: return "mouth"
        case .ear: return "ear"
        case .general: return "heart.text.square"
        case .prevention: return "shield"
        case .treatment: return "cross"
        }
    }
    
    /// Color for category
    var color: Color {
        switch self {
        case .all: return .gray
        case .throat: return .red
        case .ear: return .blue
        case .general: return .purple
        case .prevention: return .green
        case .treatment: return .orange
        }
    }
}

/// Educational content difficulty levels
enum ContentLevel: String, Codable, CaseIterable {
    case beginner = "Beginner"
    case intermediate = "Intermediate"
    case advanced = "Advanced"
    
    var color: Color {
        switch self {
        case .beginner: return .green
        case .intermediate: return .orange
        case .advanced: return .red
        }
    }
}

/// Educational content model
struct EducationalContent: Identifiable, Codable, Equatable {
    /// Unique identifier for content
    let id: String
    
    /// Title of the content
    let title: String
    
    /// Brief description
    let description: String
    
    /// Full content text (for articles)
    let content: String
    
    /// URL for media (videos, images)
    let mediaURL: String?
    
    /// Thumbnail image URL
    let thumbnailURL: String?
    
    /// Content type (article, video, infographic)
    let type: ContentType
    
    /// Primary category
    let category: ContentCategory
    
    /// Additional tags for filtering
    let tags: [String]
    
    /// Author name
    let author: String
    
    /// Publication date
    let publishedDate: Date
    
    /// Reading time estimate in minutes (for articles)
    let readingTimeMinutes: Int?
    
    /// Video duration in seconds (for videos)
    let durationSeconds: Int?
    
    /// Difficulty level
    let level: ContentLevel
    
    /// Whether content is featured
    let isFeatured: Bool
    
    /// Whether the content is premium only
    let isPremiumOnly: Bool
    
    /// Whether the content has been viewed
    var hasBeenViewed: Bool = false
    
    /// Creates a new educational content item
    init(
        id: String = UUID().uuidString,
        title: String,
        description: String,
        content: String,
        mediaURL: String? = nil,
        thumbnailURL: String? = nil,
        type: ContentType,
        category: ContentCategory,
        tags: [String] = [],
        author: String,
        publishedDate: Date,
        readingTimeMinutes: Int? = nil,
        durationSeconds: Int? = nil,
        level: ContentLevel = .beginner,
        isFeatured: Bool = false,
        isPremiumOnly: Bool = false,
        hasBeenViewed: Bool = false
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.content = content
        self.mediaURL = mediaURL
        self.thumbnailURL = thumbnailURL
        self.type = type
        self.category = category
        self.tags = tags
        self.author = author
        self.publishedDate = publishedDate
        self.readingTimeMinutes = readingTimeMinutes
        self.durationSeconds = durationSeconds
        self.level = level
        self.isFeatured = isFeatured
        self.isPremiumOnly = isPremiumOnly
        self.hasBeenViewed = hasBeenViewed
    }
    
    /// Formatted published date
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: publishedDate)
    }
    
    /// Formatted duration for videos
    var formattedDuration: String? {
        guard let seconds = durationSeconds else { return nil }
        
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        
        if minutes > 0 {
            return "\(minutes)m \(remainingSeconds)s"
        } else {
            return "\(seconds)s"
        }
    }
    
    /// Placeholder image name based on category
    var placeholderImageName: String {
        switch category {
        case .throat: return "throat_placeholder"
        case .ear: return "ear_placeholder"
        default: return "general_health_placeholder"
        }
    }
    
    /// Returns a list of sample educational content
    static func sampleContent() -> [EducationalContent] {
        let now = Date()
        let calendar = Calendar.current
        
        // Create dates in the past
        let oneWeekAgo = calendar.date(byAdding: .day, value: -7, to: now)!
        let twoWeeksAgo = calendar.date(byAdding: .day, value: -14, to: now)!
        let oneMonthAgo = calendar.date(byAdding: .month, value: -1, to: now)!
        
        return [
            // Throat Articles
            EducationalContent(
                id: "1",
                title: "Understanding Strep Throat",
                description: "Learn about the symptoms, causes, and treatments for strep throat.",
                content: """
                # Understanding Strep Throat
                
                Strep throat is a bacterial infection that can make your throat feel sore and scratchy. It's caused by group A Streptococcus bacteria.
                
                ## Symptoms
                
                - Throat pain that usually comes on quickly
                - Painful swallowing
                - Red and swollen tonsils, sometimes with white patches or streaks of pus
                - Tiny red spots on the roof of the mouth
                - Swollen, tender lymph nodes in your neck
                - Fever
                - Headache
                - Rash
                - Nausea or vomiting, especially in younger children
                
                ## Causes
                
                Strep throat is caused by infection with a bacterium known as Streptococcus pyogenes, also called group A streptococcus. Streptococcal bacteria are highly contagious. They can spread through airborne droplets when someone with the infection coughs or sneezes, or through shared food or drinks.
                
                ## Treatment
                
                Doctors typically prescribe antibiotics to treat strep throat. With treatment, you should start feeling better within 48 hours. It's important to finish your entire course of antibiotics even if you start feeling better, to ensure the infection doesn't return or cause complications.
                
                ## Prevention
                
                To prevent strep throat:
                - Wash your hands frequently
                - Cover your mouth when you cough or sneeze
                - Don't share personal items like toothbrushes or eating utensils
                
                ## When to See a Doctor
                
                See your doctor if you or your child has any of these signs and symptoms:
                - A sore throat accompanied by fever
                - A sore throat that persists for more than 48 hours
                - Difficulty swallowing or breathing
                - If you've been exposed to someone who has been diagnosed with strep throat
                """,
                thumbnailURL: "https://healthimages.com/strep_throat_thumb.jpg",
                type: .article,
                category: .throat,
                tags: ["infection", "bacterial", "antibiotics", "children"],
                author: "Dr. Sarah Johnson",
                publishedDate: oneWeekAgo,
                readingTimeMinutes: 8,
                level: .beginner,
                isFeatured: true
            ),
            
            EducationalContent(
                id: "2",
                title: "How to Recognize Ear Infections",
                description: "A guide to identifying symptoms of common ear infections.",
                content: """
                # How to Recognize Ear Infections
                
                Ear infections are one of the most common reasons parents bring their children to the doctor. While they're most common in children, adults can also get ear infections.
                
                ## Types of Ear Infections
                
                There are three main types of ear infections:
                
                ### 1. Outer Ear Infection (Otitis Externa)
                
                Also known as "swimmer's ear," this infection affects the ear canal. Symptoms include:
                - Ear pain that worsens when touching or pulling the outer ear
                - Itchiness in the ear canal
                - Drainage of clear, odorless fluid
                - Redness and swelling
                
                ### 2. Middle Ear Infection (Otitis Media)
                
                This infection affects the middle ear, the air-filled space behind the eardrum that contains the tiny vibrating bones of the ear. Symptoms include:
                - Ear pain
                - Trouble sleeping
                - Fever
                - Drainage of fluid from the ear
                - Hearing difficulties
                - Balance problems
                
                ### 3. Inner Ear Infection (Labyrinthitis)
                
                This infection affects the inner ear, which is responsible for hearing and balance. Symptoms include:
                - Vertigo (a spinning sensation)
                - Nausea and vomiting
                - Trouble with balance
                - Hearing loss
                - Tinnitus (ringing in the ears)
                
                ## When to See a Doctor
                
                See a doctor if:
                - Symptoms last more than a day
                - Ear pain is severe
                - You observe discharge of fluid, pus, or blood from the ear
                - Symptoms occur in a child less than 6 months of age
                
                ## Treatment
                
                Treatment depends on the type and severity of the infection:
                
                - Outer ear infections are usually treated with antibiotic ear drops
                - Middle ear infections may resolve on their own or require oral antibiotics
                - Inner ear infections might require anti-nausea medication, steroids, or antiviral medications
                
                ## Prevention
                
                To prevent ear infections:
                - Keep ears dry after swimming or bathing
                - Avoid putting foreign objects in the ear
                - Practice good hand hygiene
                - Stay up to date on vaccinations
                - Avoid tobacco smoke
                """,
                thumbnailURL: "https://healthimages.com/ear_infection_thumb.jpg",
                type: .article,
                category: .ear,
                tags: ["infection", "children", "antibiotics", "pain"],
                author: "Dr. Michael Chen",
                publishedDate: twoWeeksAgo,
                readingTimeMinutes: 10,
                level: .beginner
            ),
            
            // Video Content
            EducationalContent(
                id: "3",
                title: "Proper Throat Examination Technique",
                description: "A video guide for healthcare professionals on conducting thorough throat examinations.",
                content: "This video demonstrates the proper technique for examining a patient's throat, including inspection of the oropharynx, tonsils, and posterior pharyngeal wall.",
                mediaURL: "https://healthvideos.com/throat_examination_technique.mp4",
                thumbnailURL: "https://healthimages.com/throat_exam_thumb.jpg",
                type: .video,
                category: .throat,
                tags: ["examination", "clinical", "diagnostic", "professional"],
                author: "Dr. Robert Williams",
                publishedDate: oneMonthAgo,
                durationSeconds: 485,
                level: .advanced,
                isPremiumOnly: true
            ),
            
            EducationalContent(
                id: "4",
                title: "Preventing Common Ear Problems",
                description: "Learn simple strategies to prevent ear infections and other common ear conditions.",
                content: """
                # Preventing Common Ear Problems
                
                Your ears are complex organs that not only allow you to hear but also help maintain your balance. Taking care of them is important for your overall health.
                
                ## Daily Ear Care
                
                - Clean your ears properly: Never insert cotton swabs or any small objects into your ear canal. Instead, gently clean the outer ear with a washcloth.
                - Keep ears dry: After swimming or showering, tilt your head to each side to help water drain from your ears. You can also use a hair dryer on the lowest setting, held at least 12 inches away.
                - Protect from loud noises: Use earplugs or noise-canceling headphones in loud environments.
                
                ## Swimming Precautions
                
                - Consider wearing swimming earplugs
                - Dry your ears thoroughly after swimming
                - Consider using over-the-counter ear drops designed to prevent swimmer's ear
                
                ## Air Travel Tips
                
                - Yawn and swallow during ascent and descent
                - For infants, feed them during takeoff and landing
                - Consider special earplugs designed for air travel
                
                ## When to See a Doctor
                
                Consult a healthcare provider if you experience:
                - Persistent ear pain
                - Drainage from the ear
                - Hearing loss
                - Persistent ringing in the ear
                - Dizziness or balance problems
                
                ## Lifestyle Factors
                
                Certain lifestyle choices can help prevent ear problems:
                - Don't smoke, and avoid secondhand smoke
                - Manage allergies proactively
                - Keep vaccinations up to date
                - Practice good hand hygiene
                """,
                thumbnailURL: "https://healthimages.com/ear_prevention_thumb.jpg",
                type: .article,
                category: .prevention,
                tags: ["prevention", "hygiene", "swimming", "travel"],
                author: "Dr. Emily Rodriguez",
                publishedDate: twoWeeksAgo,
                readingTimeMinutes: 7,
                level: .beginner,
                isFeatured: true
            ),
            
            // Infographic Content
            EducationalContent(
                id: "5",
                title: "Anatomy of the Ear",
                description: "An interactive infographic explaining the structure and function of the human ear.",
                content: "This infographic provides a detailed look at the outer, middle, and inner ear structures and explains how they work together in the hearing process.",
                mediaURL: "https://healthimages.com/ear_anatomy_infographic.jpg",
                thumbnailURL: "https://healthimages.com/ear_anatomy_thumb.jpg",
                type: .infographic,
                category: .ear,
                tags: ["anatomy", "education", "structure", "hearing"],
                author: "Medical Illustration Team",
                publishedDate: oneMonthAgo,
                level: .intermediate
            ),
            
            // Video on treatment
            EducationalContent(
                id: "6",
                title: "Home Remedies for Sore Throat Relief",
                description: "Practical tips for finding relief from sore throat symptoms at home.",
                content: "This video covers several effective home remedies that can provide relief from sore throat symptoms, including saltwater gargles, honey and lemon tea, and proper hydration techniques.",
                mediaURL: "https://healthvideos.com/sore_throat_remedies.mp4",
                thumbnailURL: "https://healthimages.com/throat_remedies_thumb.jpg",
                type: .video,
                category: .treatment,
                tags: ["remedies", "self-care", "relief", "hydration"],
                author: "Dr. Lisa Park",
                publishedDate: oneWeekAgo,
                durationSeconds: 328,
                level: .beginner
            )
        ]
    }
}