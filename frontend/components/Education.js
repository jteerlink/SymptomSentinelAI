// This component handles the educational content display

export function initializeEducation(container) {
    if (!container) return;
    
    // Render the education component UI
    renderEducationUI(container);
    
    // Setup event listeners
    setupEducationEventListeners(container);
}

function renderEducationUI(container) {
    container.innerHTML = `
        <div class="education-container">
            <div class="education-header mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <h3>Educational Resources</h3>
                    <div class="search-container">
                        <div class="input-group">
                            <input type="text" class="form-control" id="searchEducation" placeholder="Search articles...">
                            <button class="btn btn-outline-secondary" type="button" id="searchButton">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <p class="text-muted">Learn about common throat and ear conditions, symptoms, and treatments</p>
            </div>
            
            <div class="filter-container mb-4">
                <div class="btn-group" role="group">
                    <input type="radio" class="btn-check" name="educationFilter" id="allFilter" checked>
                    <label class="btn btn-outline-primary" for="allFilter">All</label>
                    
                    <input type="radio" class="btn-check" name="educationFilter" id="throatFilter">
                    <label class="btn btn-outline-primary" for="throatFilter">Throat</label>
                    
                    <input type="radio" class="btn-check" name="educationFilter" id="earFilter">
                    <label class="btn btn-outline-primary" for="earFilter">Ear</label>
                </div>
            </div>
            
            <div class="row" id="articleContainer">
                <!-- Articles will be loaded here -->
                <div class="d-flex justify-content-center w-100 py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
            
            <!-- Article Modal -->
            <div class="modal fade" id="articleModal" tabindex="-1" aria-labelledby="articleModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="articleModalLabel">Article Title</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="articleModalBody">
                            <!-- Article content will be loaded here -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load the educational content
    loadEducationalContent(container);
}

function setupEducationEventListeners(container) {
    // Setup filter buttons
    const allFilter = container.querySelector('#allFilter');
    const throatFilter = container.querySelector('#throatFilter');
    const earFilter = container.querySelector('#earFilter');
    
    if (allFilter && throatFilter && earFilter) {
        allFilter.addEventListener('change', () => filterArticles('all', container));
        throatFilter.addEventListener('change', () => filterArticles('throat', container));
        earFilter.addEventListener('change', () => filterArticles('ear', container));
    }
    
    // Setup search functionality
    const searchInput = container.querySelector('#searchEducation');
    const searchButton = container.querySelector('#searchButton');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            searchArticles(searchTerm, container);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.trim().toLowerCase();
                searchArticles(searchTerm, container);
            }
        });
    }
}

async function loadEducationalContent(container) {
    try {
        // In a real app, you would fetch this data from your backend API
        // For the demo, we'll use static sample data
        const articles = getEducationalArticles();
        
        // Render the articles
        renderArticles(articles, container);
    } catch (error) {
        console.error('Error loading educational content:', error);
        showError(container);
    }
}

function renderArticles(articles, container) {
    const articleContainer = container.querySelector('#articleContainer');
    
    if (!articleContainer) return;
    
    if (articles.length === 0) {
        articleContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="empty-state">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h4 class="mt-3">No Articles Found</h4>
                    <p class="text-muted">Try adjusting your search or filter criteria</p>
                </div>
            </div>
        `;
        return;
    }
    
    const articlesHTML = articles.map(article => {
        return `
            <div class="col-md-6 col-lg-4 mb-4 article-item" data-category="${article.category}">
                <div class="article-card h-100">
                    <div class="article-image">
                        <i class="${article.category === 'throat' ? 'fas fa-head-side-cough' : 'fas fa-deaf'} fa-3x"></i>
                    </div>
                    <div class="article-content">
                        <h5>${article.title}</h5>
                        <p class="text-muted">${article.summary}</p>
                        <div class="mb-3">
                            <span class="article-tag">${article.category === 'throat' ? 'Throat' : 'Ear'}</span>
                            ${article.tags.map(tag => `<span class="article-tag">${tag}</span>`).join('')}
                        </div>
                        <button class="btn btn-outline-primary read-article-btn" data-article-id="${article.id}">
                            Read More
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    articleContainer.innerHTML = articlesHTML;
    
    // Add event listeners to the read more buttons
    const readButtons = container.querySelectorAll('.read-article-btn');
    readButtons.forEach(button => {
        button.addEventListener('click', () => {
            const articleId = button.getAttribute('data-article-id');
            const article = articles.find(a => a.id === articleId);
            if (article) {
                showArticleModal(article, container);
            }
        });
    });
}

function showArticleModal(article, container) {
    // Get the modal elements
    const modal = container.querySelector('#articleModal');
    const modalTitle = container.querySelector('#articleModalLabel');
    const modalBody = container.querySelector('#articleModalBody');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    // Set the modal content
    modalTitle.textContent = article.title;
    
    // Create the article content
    modalBody.innerHTML = `
        <div class="article-header mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <span class="badge bg-primary">${article.category === 'throat' ? 'Throat' : 'Ear'}</span>
                    ${article.tags.map(tag => `<span class="badge bg-secondary ms-1">${tag}</span>`).join('')}
                </div>
                <div class="text-muted small">Last updated: ${article.updatedAt}</div>
            </div>
        </div>
        
        <div class="article-content">
            ${article.content}
        </div>
        
        <div class="article-footer mt-4 pt-3 border-top">
            <h5>Related Conditions</h5>
            <ul>
                ${article.relatedConditions.map(condition => `
                    <li>
                        <strong>${condition.name}</strong>: ${condition.description}
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    // Show the modal safely
    try {
        // Check if bootstrap is available globally
        if (typeof bootstrap !== 'undefined') {
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
        } else {
            // Fallback using jQuery if available
            if (typeof $ !== 'undefined') {
                $(modal).modal('show');
            } else {
                // Manual fallback - add 'show' class and display modal
                modal.classList.add('show');
                modal.style.display = 'block';
                document.body.classList.add('modal-open');
                
                // Create backdrop manually if it doesn't exist
                let backdrop = document.querySelector('.modal-backdrop');
                if (!backdrop) {
                    backdrop = document.createElement('div');
                    backdrop.className = 'modal-backdrop fade show';
                    document.body.appendChild(backdrop);
                }
                
                // Add click listener to close button
                const closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"]');
                closeButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        modal.classList.remove('show');
                        modal.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        if (backdrop && backdrop.parentNode) {
                            backdrop.parentNode.removeChild(backdrop);
                        }
                    });
                });
            }
        }
    } catch (error) {
        console.error('Error showing modal:', error);
        alert(`Article: ${article.title} - Please see the full education section for details.`);
    }
}

function filterArticles(category, container) {
    const articles = container.querySelectorAll('.article-item');
    
    articles.forEach(article => {
        const articleCategory = article.getAttribute('data-category');
        
        if (category === 'all' || category === articleCategory) {
            article.style.display = 'block';
        } else {
            article.style.display = 'none';
        }
    });
}

function searchArticles(searchTerm, container) {
    const articles = container.querySelectorAll('.article-item');
    let foundAny = false;
    
    articles.forEach(article => {
        const title = article.querySelector('h5').textContent.toLowerCase();
        const summary = article.querySelector('p').textContent.toLowerCase();
        const tags = Array.from(article.querySelectorAll('.article-tag')).map(tag => tag.textContent.toLowerCase());
        
        // Check if the search term is in the title, summary, or tags
        const matchesSearch = 
            title.includes(searchTerm) || 
            summary.includes(searchTerm) || 
            tags.some(tag => tag.includes(searchTerm));
        
        if (matchesSearch) {
            article.style.display = 'block';
            foundAny = true;
        } else {
            article.style.display = 'none';
        }
    });
    
    // Show a message if no articles were found
    const articleContainer = container.querySelector('#articleContainer');
    if (articleContainer && !foundAny) {
        // Check if the no-results message already exists
        let noResultsElement = articleContainer.querySelector('.no-results-message');
        
        if (!noResultsElement) {
            noResultsElement = document.createElement('div');
            noResultsElement.className = 'col-12 text-center py-4 no-results-message';
            noResultsElement.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-search"></i>
                    No articles found for "${searchTerm}". Try a different search term.
                </div>
            `;
            articleContainer.appendChild(noResultsElement);
        } else {
            noResultsElement.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-search"></i>
                    No articles found for "${searchTerm}". Try a different search term.
                </div>
            `;
        }
    } else if (articleContainer) {
        // Remove the no-results message if it exists
        const noResultsElement = articleContainer.querySelector('.no-results-message');
        if (noResultsElement) {
            noResultsElement.remove();
        }
    }
}

function showError(container) {
    const articleContainer = container.querySelector('#articleContainer');
    
    if (articleContainer) {
        articleContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error loading educational content. Please try again later.
                </div>
            </div>
        `;
    }
}

// Sample data for educational articles
function getEducationalArticles() {
    return [
        {
            id: "throat-01",
            title: "Understanding Strep Throat",
            summary: "Learn about the causes, symptoms, and treatments for strep throat infections.",
            category: "throat",
            tags: ["infection", "bacterial"],
            updatedAt: "2023-05-15",
            content: `
                <h4>What is Strep Throat?</h4>
                <p>Strep throat is a bacterial infection that affects the throat and tonsils. It's caused by group A Streptococcus bacteria and is most common in children between the ages of 5 and 15.</p>
                
                <h4>Symptoms</h4>
                <p>Common symptoms of strep throat include:</p>
                <ul>
                    <li>Throat pain that usually comes on quickly</li>
                    <li>Painful swallowing</li>
                    <li>Red and swollen tonsils, sometimes with white patches or streaks of pus</li>
                    <li>Tiny red spots on the roof of the mouth</li>
                    <li>Swollen, tender lymph nodes in your neck</li>
                    <li>Fever</li>
                    <li>Headache</li>
                    <li>Rash</li>
                    <li>Nausea or vomiting, especially in younger children</li>
                </ul>
                
                <h4>Diagnosis</h4>
                <p>Your healthcare provider will examine your throat and may perform a rapid strep test or throat culture to confirm the diagnosis.</p>
                
                <h4>Treatment</h4>
                <p>Strep throat is typically treated with antibiotics, such as penicillin or amoxicillin. It's important to complete the full course of antibiotics, even if you feel better before they're finished. Over-the-counter pain relievers can help alleviate throat pain and reduce fever.</p>
                
                <h4>Prevention</h4>
                <p>To prevent strep throat, practice good hygiene:</p>
                <ul>
                    <li>Wash your hands regularly</li>
                    <li>Cover your mouth when coughing or sneezing</li>
                    <li>Don't share personal items like utensils or drinking glasses</li>
                </ul>
                
                <h4>When to See a Doctor</h4>
                <p>See a doctor if you experience symptoms of strep throat, especially if you have a fever, swollen tonsils, or difficulty swallowing. Without proper treatment, strep throat can lead to complications.</p>
            `,
            relatedConditions: [
                {
                    name: "Tonsillitis",
                    description: "Inflammation of the tonsils, often caused by infection"
                },
                {
                    name: "Scarlet Fever",
                    description: "A bacterial infection that develops in some people with strep throat"
                }
            ]
        },
        {
            id: "ear-01",
            title: "Ear Infections: Causes and Treatments",
            summary: "Everything you need to know about common ear infections, from symptoms to effective treatments.",
            category: "ear",
            tags: ["infection", "pain"],
            updatedAt: "2023-06-02",
            content: `
                <h4>Types of Ear Infections</h4>
                <p>There are three main types of ear infections:</p>
                <ul>
                    <li><strong>Outer ear infection (otitis externa):</strong> Also known as swimmer's ear, it affects the ear canal.</li>
                    <li><strong>Middle ear infection (otitis media):</strong> Most common in children, affecting the air-filled space behind the eardrum.</li>
                    <li><strong>Inner ear infection (labyrinthitis):</strong> Affects the innermost part of the ear, often causing balance problems.</li>
                </ul>
                
                <h4>Symptoms of Ear Infections</h4>
                <p>Common symptoms vary depending on the type of infection but may include:</p>
                <ul>
                    <li>Ear pain or fullness</li>
                    <li>Fluid drainage from the ear</li>
                    <li>Hearing loss or difficulty</li>
                    <li>Fever</li>
                    <li>Irritability in young children</li>
                    <li>Difficulty sleeping</li>
                    <li>Balance problems</li>
                </ul>
                
                <h4>Causes</h4>
                <p>Ear infections can be caused by bacteria or viruses and often develop after a cold, flu, or allergic reaction. In children, the eustachian tubes (connecting the middle ear to the back of the throat) are shorter and more horizontal, making them more prone to infections.</p>
                
                <h4>Diagnosis</h4>
                <p>Your healthcare provider will use an otoscope to examine your ear and may perform additional tests if needed.</p>
                
                <h4>Treatment</h4>
                <p>Treatment depends on the type and severity of the infection:</p>
                <ul>
                    <li><strong>Antibiotics:</strong> Prescribed for bacterial infections</li>
                    <li><strong>Pain relievers:</strong> To reduce pain and fever</li>
                    <li><strong>Ear drops:</strong> For outer ear infections or pain relief</li>
                    <li><strong>Watchful waiting:</strong> Some mild infections clear up without antibiotics</li>
                </ul>
                
                <h4>Prevention</h4>
                <p>To help prevent ear infections:</p>
                <ul>
                    <li>Keep ears dry after swimming</li>
                    <li>Avoid inserting objects into the ear</li>
                    <li>Practice good hygiene</li>
                    <li>Stay up-to-date on vaccinations</li>
                    <li>Avoid smoke exposure</li>
                </ul>
                
                <h4>When to See a Doctor</h4>
                <p>See a doctor if you experience severe ear pain, fluid drainage, or symptoms that don't improve after a few days.</p>
            `,
            relatedConditions: [
                {
                    name: "Swimmers Ear",
                    description: "Infection of the outer ear canal, often caused by water exposure"
                },
                {
                    name: "Eustachian Tube Dysfunction",
                    description: "When the tubes connecting your middle ear to your throat don't open or close properly"
                }
            ]
        },
        {
            id: "throat-02",
            title: "Tonsillitis: Symptoms and Treatment",
            summary: "A comprehensive guide to tonsillitis, including how to identify it and treat it effectively.",
            category: "throat",
            tags: ["inflammation", "tonsils"],
            updatedAt: "2023-04-20",
            content: `
                <h4>What is Tonsillitis?</h4>
                <p>Tonsillitis is inflammation of the tonsils, the two oval-shaped pads of tissue at the back of the throat. It's most common in children but can affect people of any age.</p>
                
                <h4>Symptoms</h4>
                <p>Common symptoms of tonsillitis include:</p>
                <ul>
                    <li>Red, swollen tonsils</li>
                    <li>White or yellow coating or patches on the tonsils</li>
                    <li>Sore throat</li>
                    <li>Difficult or painful swallowing</li>
                    <li>Fever</li>
                    <li>Enlarged, tender lymph nodes in the neck</li>
                    <li>Bad breath</li>
                    <li>Headache</li>
                    <li>Stomachache, particularly in younger children</li>
                    <li>Stiff neck</li>
                    <li>Voice changes due to swelling</li>
                </ul>
                
                <h4>Causes</h4>
                <p>Tonsillitis can be caused by viral infections (more common) or bacterial infections. The most common bacterial cause is Streptococcus pyogenes (group A streptococcus), which causes strep throat.</p>
                
                <h4>Diagnosis</h4>
                <p>Your healthcare provider will examine your throat and may take a throat swab to test for strep bacteria. They may also order blood tests to check for other infections.</p>
                
                <h4>Treatment</h4>
                <p>Treatment depends on the cause:</p>
                <ul>
                    <li><strong>Viral tonsillitis:</strong> Supportive care, including rest, fluids, and pain relievers</li>
                    <li><strong>Bacterial tonsillitis:</strong> Antibiotics, usually penicillin or amoxicillin</li>
                    <li><strong>Recurrent tonsillitis:</strong> In cases of frequent tonsillitis, a tonsillectomy (surgical removal of the tonsils) may be recommended</li>
                </ul>
                
                <h4>Home Remedies</h4>
                <p>To ease symptoms:</p>
                <ul>
                    <li>Get plenty of rest</li>
                    <li>Drink warm or cool liquids to soothe the throat</li>
                    <li>Eat soft foods that are easy to swallow</li>
                    <li>Gargle with warm salt water</li>
                    <li>Use throat lozenges or hard candies (for children old enough to safely use them)</li>
                    <li>Use a humidifier to add moisture to the air</li>
                </ul>
                
                <h4>When to See a Doctor</h4>
                <p>See a doctor if you have symptoms of tonsillitis that don't improve within 24 to 48 hours, severe symptoms, or difficulty breathing or swallowing.</p>
            `,
            relatedConditions: [
                {
                    name: "Strep Throat",
                    description: "A bacterial infection that can cause tonsillitis"
                },
                {
                    name: "Peritonsillar Abscess",
                    description: "A pus-filled infection that develops next to a tonsil"
                }
            ]
        },
        {
            id: "ear-02",
            title: "Understanding Earwax Buildup",
            summary: "Learn about the causes of earwax buildup, safe removal methods, and when to seek medical help.",
            category: "ear",
            tags: ["earwax", "blockage"],
            updatedAt: "2023-05-30",
            content: `
                <h4>What is Earwax?</h4>
                <p>Earwax (cerumen) is a natural substance produced by glands in the ear canal. It helps protect the ear by trapping dust, bacteria, and other particles, and preventing them from reaching the eardrum.</p>
                
                <h4>Causes of Earwax Buildup</h4>
                <p>Several factors can lead to earwax buildup:</p>
                <ul>
                    <li>Overproduction of earwax</li>
                    <li>Narrow or hairy ear canals</li>
                    <li>Age (older adults typically have drier, harder earwax)</li>
                    <li>Use of hearing aids or earbuds</li>
                    <li>Improper cleaning methods, like using cotton swabs that push wax deeper</li>
                </ul>
                
                <h4>Symptoms</h4>
                <p>Common symptoms of earwax buildup include:</p>
                <ul>
                    <li>Earache or a feeling of fullness in the ear</li>
                    <li>Partial hearing loss</li>
                    <li>Tinnitus (ringing in the ear)</li>
                    <li>Itching in the ear canal</li>
                    <li>Discharge or odor from the ear</li>
                    <li>Coughing (due to stimulation of the vagus nerve)</li>
                </ul>
                
                <h4>Safe Removal Methods</h4>
                <p>If you're experiencing symptoms of earwax buildup, try these safe removal methods:</p>
                <ul>
                    <li><strong>Over-the-counter ear drops:</strong> Wax-softening drops can help break up the wax</li>
                    <li><strong>Irrigation:</strong> After softening the wax, gently rinse your ear with warm water using a bulb syringe</li>
                    <li><strong>Professional removal:</strong> A healthcare provider can safely remove earwax using specialized tools</li>
                </ul>
                
                <h4>What Not to Do</h4>
                <p>Avoid these unsafe methods:</p>
                <ul>
                    <li>Don't insert objects into your ear canal (including cotton swabs, bobby pins, or keys)</li>
                    <li>Don't use ear candles, which can cause injury</li>
                    <li>Don't try to remove wax if you have ear tubes, a perforated eardrum, or ear pain</li>
                </ul>
                
                <h4>Prevention</h4>
                <p>To prevent earwax buildup:</p>
                <ul>
                    <li>Clean the outer ear with a washcloth</li>
                    <li>Use preventive ear drops if you're prone to buildup</li>
                    <li>Schedule regular check-ups if you use hearing aids</li>
                </ul>
                
                <h4>When to See a Doctor</h4>
                <p>See a healthcare provider if:</p>
                <ul>
                    <li>Home remedies don't improve symptoms</li>
                    <li>You experience pain, drainage, or bleeding from the ear</li>
                    <li>You have significant hearing loss</li>
                    <li>You have a history of ear problems or surgery</li>
                </ul>
            `,
            relatedConditions: [
                {
                    name: "Otitis Externa",
                    description: "Inflammation of the ear canal, sometimes related to earwax issues"
                },
                {
                    name: "Eardrum Perforation",
                    description: "A hole or tear in the eardrum, which can be caused by improper earwax removal"
                }
            ]
        },
        {
            id: "throat-03",
            title: "Laryngitis: Causes, Symptoms & Treatment",
            summary: "Find out what causes laryngitis, how to recognize it, and the best ways to treat and prevent it.",
            category: "throat",
            tags: ["voice", "inflammation"],
            updatedAt: "2023-03-10",
            content: `
                <h4>What is Laryngitis?</h4>
                <p>Laryngitis is inflammation of the larynx (voice box) that causes voice changes, typically hoarseness or loss of voice. It can be acute (short-term) or chronic (long-lasting).</p>
                
                <h4>Symptoms</h4>
                <p>Common symptoms of laryngitis include:</p>
                <ul>
                    <li>Hoarseness or voice loss</li>
                    <li>Weakened voice</li>
                    <li>Sore or raw throat</li>
                    <li>Dry throat</li>
                    <li>Dry cough</li>
                    <li>Tickling sensation in the throat</li>
                    <li>Difficulty swallowing</li>
                </ul>
                
                <h4>Causes</h4>
                <p>Laryngitis can be caused by:</p>
                <ul>
                    <li><strong>Viral infections:</strong> Such as the common cold or flu (most common cause)</li>
                    <li><strong>Vocal strain:</strong> Overusing your voice through yelling, singing, or talking</li>
                    <li><strong>Bacterial infections:</strong> Less common but possible</li>
                    <li><strong>Irritants:</strong> Allergies, smoke, chemical fumes, or GERD (gastroesophageal reflux disease)</li>
                </ul>
                
                <h4>Diagnosis</h4>
                <p>Your healthcare provider can usually diagnose laryngitis based on your symptoms and a physical examination. In some cases, they may use a laryngoscope to get a closer look at your vocal cords.</p>
                
                <h4>Treatment</h4>
                <p>Treatment for laryngitis focuses on the underlying cause:</p>
                <ul>
                    <li><strong>Rest your voice:</strong> Avoid talking or singing</li>
                    <li><strong>Stay hydrated:</strong> Drink plenty of fluids</li>
                    <li><strong>Use a humidifier:</strong> To add moisture to the air</li>
                    <li><strong>Avoid irritants:</strong> Such as smoke and alcohol</li>
                    <li><strong>Over-the-counter pain relievers:</strong> To reduce pain and inflammation</li>
                    <li><strong>Antibiotics:</strong> Only if a bacterial infection is present</li>
                </ul>
                
                <h4>Home Remedies</h4>
                <p>These home remedies may help soothe your symptoms:</p>
                <ul>
                    <li>Gargle with warm salt water</li>
                    <li>Suck on throat lozenges</li>
                    <li>Breathe in steam from a hot shower or bowl of hot water</li>
                    <li>Avoid whispering, which can strain your voice more than speaking softly</li>
                </ul>
                
                <h4>When to See a Doctor</h4>
                <p>See a doctor if:</p>
                <ul>
                    <li>Your hoarseness lasts more than two weeks</li>
                    <li>You cough up blood</li>
                    <li>You have difficulty breathing</li>
                    <li>You have pain that is severe or worsening</li>
                    <li>You have difficulty swallowing</li>
                    <li>You have a high fever</li>
                </ul>
            `,
            relatedConditions: [
                {
                    name: "Vocal Cord Nodules",
                    description: "Callus-like growths on the vocal cords caused by vocal strain"
                },
                {
                    name: "GERD",
                    description: "Gastroesophageal reflux disease, which can irritate the throat and voice box"
                }
            ]
        },
        {
            id: "ear-03",
            title: "Tinnitus: Understanding the Ringing in Your Ears",
            summary: "Explore the causes, symptoms, and management strategies for tinnitus, the perception of noise in the ears.",
            category: "ear",
            tags: ["ringing", "noise"],
            updatedAt: "2023-06-10",
            content: `
                <h4>What is Tinnitus?</h4>
                <p>Tinnitus is the perception of noise or ringing in the ears when no external sound is present. It's not a disease but a symptom of an underlying condition, such as hearing loss, ear injury, or a circulatory system disorder.</p>
                
                <h4>Types of Tinnitus</h4>
                <p>There are two main types of tinnitus:</p>
                <ul>
                    <li><strong>Subjective tinnitus:</strong> Only you can hear the noise. This is the most common type.</li>
                    <li><strong>Objective tinnitus:</strong> Your doctor can hear the noise during an examination. This rare type is often caused by blood vessel issues, muscle contractions, or bone conditions.</li>
                </ul>
                
                <h4>Symptoms</h4>
                <p>Tinnitus symptoms may include these sounds in your ears:</p>
                <ul>
                    <li>Ringing</li>
                    <li>Buzzing</li>
                    <li>Hissing</li>
                    <li>Whistling</li>
                    <li>Humming</li>
                    <li>Clicking</li>
                    <li>Roaring</li>
                </ul>
                <p>The sounds may vary in pitch and can be heard in one or both ears. They might be constant or come and go.</p>
                
                <h4>Causes</h4>
                <p>Common causes of tinnitus include:</p>
                <ul>
                    <li><strong>Hearing loss:</strong> Age-related or noise-induced</li>
                    <li><strong>Ear and sinus infections</strong></li>
                    <li><strong>Earwax blockage</strong></li>
                    <li><strong>Head or neck injuries</strong></li>
                    <li><strong>Medications:</strong> Some antibiotics, cancer medications, diuretics, and high doses of aspirin</li>
                    <li><strong>Blood vessel disorders:</strong> Such as high blood pressure or atherosclerosis</li>
                    <li><strong>Meniere's disease:</strong> An inner ear disorder</li>
                    <li><strong>Acoustic neuroma:</strong> A noncancerous tumor on the cranial nerve</li>
                </ul>
                
                <h4>Diagnosis</h4>
                <p>Your doctor will examine your ears and conduct a hearing test. They may also order imaging tests, like CT or MRI scans, to check for underlying causes.</p>
                
                <h4>Treatment and Management</h4>
                <p>Treatment focuses on the underlying cause and may include:</p>
                <ul>
                    <li><strong>Earwax removal:</strong> If blockage is the cause</li>
                    <li><strong>Treating blood vessel conditions:</strong> Such as high blood pressure</li>
                    <li><strong>Changing medications:</strong> If a medication is causing your tinnitus</li>
                    <li><strong>Noise suppression:</strong> White noise machines, hearing aids, or masking devices</li>
                    <li><strong>Lifestyle modifications:</strong> Reducing stress, improving sleep, limiting alcohol and caffeine</li>
                    <li><strong>Counseling:</strong> Cognitive behavioral therapy can help you cope with tinnitus</li>
                    <li><strong>Sound therapy:</strong> Helps you focus on external sounds instead of the tinnitus</li>
                </ul>
                
                <h4>When to See a Doctor</h4>
                <p>See a doctor if:</p>
                <ul>
                    <li>Your tinnitus is accompanied by dizziness or hearing loss</li>
                    <li>It develops after an upper respiratory infection</li>
                    <li>It occurs suddenly or without clear cause</li>
                    <li>It's affecting your quality of life, sleep, or concentration</li>
                </ul>
            `,
            relatedConditions: [
                {
                    name: "Meniere's Disease",
                    description: "An inner ear disorder that causes vertigo, hearing loss, and tinnitus"
                },
                {
                    name: "Acoustic Neuroma",
                    description: "A noncancerous tumor that develops on the cranial nerve"
                }
            ]
        }
    ];
}
